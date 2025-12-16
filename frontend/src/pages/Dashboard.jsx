import React, { useEffect, useRef, useState } from "react";
import { createRealtimeClient } from "../utils/realtime";
import { getToken, getProfile } from "../utils/auth";
import { updateProfile } from "../utils/api";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import { getProducts, getSuppliers, getPurchases } from "../utils/api";
import { isStoreManager, isAdmin } from "../utils/roles";

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    todayTransactions: 0,
    warehouseValue: 0,
    teamMembers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [realtimeMode, setRealtimeMode] = useState('mock'); // 'mock' | 'ws' | 'off'
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const [saveToProfile, setSaveToProfile] = useState(() => {
    const v = localStorage.getItem('dashboard_realtime_save');
    return v === 'true';
  });

  useEffect(() => {
    const userProfile = getProfile();
    setProfile(userProfile);
    
    let mounted = true;
    const fetchData = async () => {
      try {
        const [pRes, sRes, rRes] = await Promise.all([
          getProducts(),
          getSuppliers(),
          getPurchases(),
        ]);
        if (!mounted) return;
        setProducts(pRes?.data ?? []);
        setSuppliers(sRes?.data ?? []);
        setPurchaseOrders(rRes?.data ?? []);

        // Mock additional data for Store Manager view
        if (isStoreManager(userProfile?.role)) {
          setStats({
            todayTransactions: 34,
            warehouseValue: 156780,
            teamMembers: 5
          });

          setRecentActivity([
            { id: 1, type: 'stock-in', user: 'Alice Johnson', product: 'Widget A', quantity: 50, time: '10 mins ago' },
            { id: 2, type: 'stock-out', user: 'Bob Williams', product: 'Gadget B', quantity: 25, time: '25 mins ago' },
            { id: 3, type: 'product-added', user: 'You', product: 'Tool C', quantity: 100, time: '1 hour ago' },
            { id: 4, type: 'stock-in', user: 'Carol Davis', product: 'Part D', quantity: 200, time: '2 hours ago' }
          ]);

          const lowStock = (pRes?.data ?? []).filter(p => p.stock < p.reorderLevel).slice(0, 3);
          setLowStockProducts(lowStock.map(p => ({
            sku: p.sku,
            name: p.name,
            current: p.stock,
            reorder: p.reorderLevel,
            status: p.stock < p.reorderLevel * 0.3 ? 'critical' : 'warning'
          })));

          setPendingApprovals([
            { id: 'PO-2025-045', product: 'Widget A', quantity: 200, vendor: 'Supplier Inc', amount: 4500, submitted: '2 hours ago' },
            { id: 'PO-2025-046', product: 'Gadget B', quantity: 150, vendor: 'Parts Corp', amount: 3200, submitted: '5 hours ago' }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (!mounted) return;
        setProducts([]);
        setSuppliers([]);
        setPurchaseOrders([]);
      }
    };

    fetchData();

    // If using mock mode via env var, start a mock realtime updater after initial data loads
    const USE_MOCK_ENV = import.meta.env.VITE_DASHBOARD_USE_MOCK === 'true';
    const stored = localStorage.getItem('dashboard_realtime_mode');
    if (!stored) {
      // If user hasn't chosen, seed from env
      if (USE_MOCK_ENV) {
        setRealtimeMode('mock');
        localStorage.setItem('dashboard_realtime_mode', 'mock');
      }
    } else {
      setRealtimeMode(stored);
    }

    let mockTimer = null;
    const startMockRealtime = () => {
      if (mockTimer) return;
      mockTimer = setInterval(() => {
        // Add a small random activity and update stats
        const activityTypes = ['stock-in', 'stock-out', 'product-added'];
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const users = ['Alice Johnson','Bob Williams','Carol Davis','You','Derek Lee'];
        const prods = (products || []).slice(0,5).map(p => p.name) || ['Item A','Item B'];
        const activity = {
          id: Date.now(),
          type,
          user: users[Math.floor(Math.random() * users.length)],
          product: prods[Math.floor(Math.random() * prods.length)] || 'Product X',
          quantity: Math.floor(Math.random() * 120) + 1,
          time: 'just now'
        };
        setRecentActivity(prev => [activity, ...(prev || [])].slice(0,8));
        setStats(s => ({ ...s, todayTransactions: (s.todayTransactions || 0) + Math.floor(Math.random()*3) + 1 }));
      }, 6000);
    };

    if (USE_MOCK_ENV && (localStorage.getItem('dashboard_realtime_mode') || 'mock') === 'mock') startMockRealtime();
    return () => {
      mounted = false;
      if (mockTimer) clearInterval(mockTimer);
    };
  }, []);

  // WebSocket connect/disconnect handlers (attempts a connection to backend if user toggles realtime 'ws')
  useEffect(() => {
    // Clean up when not ws
    if (realtimeMode !== 'ws') {
      if (wsRef.current && wsRef.current.close) {
        try { wsRef.current.close(); } catch (e){}
      }
      wsRef.current = null;
      setWsStatus('disconnected');
      return;
    }

    // Build URL; allow explicit override via VITE_WS_URL else derive from API base
    const envUrl = import.meta.env.VITE_WS_URL;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081');
    const wsSuffix = import.meta.env.VITE_WS_PATH || '/ws';
    const token = getToken();
    const normalizeIncoming = (raw) => {
      // raw may be a JSON string or already parsed
      let obj = raw;
      if (typeof raw === 'string') {
        try { obj = JSON.parse(raw); } catch (e) { obj = raw; }
      }
      // Several server formats supported:
      // 1) { type: 'activity', payload: {...} }
      // 2) { event: 'activity', data: {...} }
      // 3) { activity: {...} }
      if (obj && typeof obj === 'object') {
        if (obj.type && obj.payload) return { type: obj.type, payload: obj.payload };
        if (obj.event && obj.data) return { type: obj.event, payload: obj.data };
        if (obj.activity) return { type: 'activity', payload: obj.activity };
        if (obj.type && obj.data) return { type: obj.type, payload: obj.data };
      }
      return obj;
    };

    const urlFactory = () => {
      const raw = envUrl || base;
      let u = raw;
      if (!envUrl) {
        if (raw.startsWith('https')) u = raw.replace(/^https/, 'wss');
        else u = raw.replace(/^http/, 'ws');
        u = u.replace(/\/$/, '') + wsSuffix;
      }
      // attach token as query param when present (backend can validate)
      if (token) {
        const join = u.includes('?') ? '&' : '?';
        u = `${u}${join}token=${encodeURIComponent(token)}`;
      }
      return u;
    };

    const client = createRealtimeClient(urlFactory, { reconnect: true, maxReconnectAttempts: 50, parseMessage: normalizeIncoming });
    wsRef.current = client;
    setWsStatus('connecting');

    client.on('open', () => setWsStatus('connected'));
    client.on('close', () => setWsStatus('disconnected'));
    client.on('error', () => setWsStatus('error'));
    client.on('activity', (payload) => {
      setRecentActivity(prev => [payload, ...(prev || [])].slice(0,8));
      // Show toast for important events
      try {
        const t = payload?.type || payload?.event;
        if (t === 'stock-out' || payload?.status === 'low-stock') {
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: `${payload.product || 'Item'} is low or out of stock` } }));
        }
      } catch (e) { console.debug('[realtime] notify error', e); }
    });
    client.on('stats', (payload) => {
      setStats(s => ({ ...s, ...payload }));
    });
    client.on('message', (msg) => {
      // fallback: if message is raw activity-like object
      if (msg && msg.payload && msg.type) return; // already handled
      // attempt to interpret raw message as activity
      if (msg && msg.type === 'activity' && msg.payload) setRecentActivity(prev => [msg.payload, ...(prev || [])].slice(0,8));
    });

    try { client.connect(); } catch (e) { console.debug('[realtime] connect error', e); setWsStatus('error'); }

    return () => {
      try { client.close(); } catch (e){}
      wsRef.current = null;
      setWsStatus('disconnected');
    };
  }, [realtimeMode]);

  // Save preference to profile when requested
  const saveProfilePreference = async (mode) => {
    try {
      const local = getProfile();
      if (!local || !local.id) {
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Sign in to save preferences' } }));
        return;
      }
      const updated = { ...local, preferences: { ...(local.preferences || {}), dashboardRealtimeMode: mode } };
      await updateProfile(local.id, updated);
      setProfile(updated);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Saved dashboard preference to profile' } }));
    } catch (e) {
      console.error('Failed saving profile preference', e);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Could not save preference to profile' } }));
    }
  };

  useEffect(() => {
    // always persist locally
    localStorage.setItem('dashboard_realtime_mode', realtimeMode);
    if (saveToProfile) saveProfilePreference(realtimeMode);
  }, [realtimeMode, saveToProfile]);

  const lowStockCount = products.filter(p => p.stock < p.reorderLevel).length;
  const userRole = profile?.role;

  const getActivityIcon = (type) => {
    switch(type) {
      case 'stock-in': return '📦';
      case 'stock-out': return '📤';
      case 'product-added': return '➕';
      default: return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'stock-in': return 'bg-green-50 text-green-800';
      case 'stock-out': return 'bg-blue-50 text-blue-800';
      case 'product-added': return 'bg-purple-50 text-purple-800';
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  // Store Manager Dashboard
  if (isStoreManager(userRole)) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Store Manager Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {profile?.warehouse || 'North Warehouse'} • Welcome back, {profile?.fullName || 'Manager'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                📊 Export Report
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Real-time</label>
                <select
                  value={realtimeMode}
                  onChange={(e) => setRealtimeMode(e.target.value)}
                  className="px-2 py-1 border rounded-md text-sm"
                >
                  <option value="mock">Mock</option>
                  <option value="ws">WebSocket</option>
                  <option value="off">Off</option>
                </select>
                <label className="flex items-center gap-2 ml-3 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setSaveToProfile(v);
                      localStorage.setItem('dashboard_realtime_save', v ? 'true' : 'false');
                      if (v) saveProfilePreference(realtimeMode);
                    }}
                    className="w-4 h-4"
                  />
                  <span>Save to profile</span>
                </label>
                <div className="text-xs text-gray-500 px-2">{wsStatus}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Info Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👔</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Store Manager Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>Add/Edit/Delete Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>Update Stock-In/Out Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>View Inventory Dashboard & Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>Generate Purchase Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>Request Admin Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✔</span>
                  <span>View Vendor List & Export Reports</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-400 text-xs opacity-90">
                <strong>Note:</strong> You cannot create users, approve purchase orders, or access other warehouses.
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📦</span>
              <span className="text-xs text-gray-500">INVENTORY</span>
            </div>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-xs text-gray-500">ALERTS</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            <p className="text-sm text-gray-600">Low Stock Items</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📋</span>
              <span className="text-xs text-gray-500">ORDERS</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{purchaseOrders.length}</p>
            <p className="text-sm text-gray-600">Pending Purchase Orders</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📝</span>
              <span className="text-xs text-gray-500">TODAY</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.todayTransactions}</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs text-gray-500">VALUE</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">${(stats.warehouseValue / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-600">Warehouse Value</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👥</span>
              <span className="text-xs text-gray-500">TEAM</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.teamMembers}</p>
            <p className="text-sm text-gray-600">Team Members</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/products')}
                className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="text-2xl mb-2">➕</div>
                <div className="font-semibold text-sm">Add Product</div>
                <div className="text-xs text-gray-600">Create new item</div>
              </button>

              <button
                onClick={() => navigate('/transactions')}
                className="p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-semibold text-sm">Record Stock</div>
                <div className="text-xs text-gray-600">Stock In/Out</div>
              </button>

              <button
                onClick={() => navigate('/transactions')}
                className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-left"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold text-sm">Purchase Order</div>
                <div className="text-xs text-gray-600">Generate PO</div>
              </button>

              <button
                onClick={() => navigate('/suppliers')}
                className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-left"
              >
                <div className="text-2xl mb-2">🏭</div>
                <div className="font-semibold text-sm">View Vendors</div>
                <div className="text-xs text-gray-600">Supplier list</div>
              </button>

              <button
                onClick={() => navigate('/forecast')}
                className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition text-left"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-sm">AI Forecast</div>
                <div className="text-xs text-gray-600">Demand prediction</div>
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="p-4 border-2 border-pink-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition text-left"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-semibold text-sm">Analytics</div>
                <div className="text-xs text-gray-600">View reports</div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🕒</span> Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className={`flex items-start p-3 rounded-lg ${getActivityColor(activity.type)}`}>
                  <span className="text-xl mr-3">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{activity.user} • {activity.product}</div>
                    <div className="text-sm">Quantity: {activity.quantity}</div>
                    <div className="text-xs opacity-75 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚠️</span> Low Stock Alerts
            </h2>
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.sku} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-red-800">{product.name}</div>
                    <div className="text-sm text-red-600">
                      SKU: {product.sku} • Current: {product.current} / Reorder: {product.reorder}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/transactions')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Create PO
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/products')}
              className="w-full mt-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              View All Low Stock Items ({lowStockCount})
            </button>
          </div>

          {/* Pending Admin Approvals */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⏳</span> Awaiting Admin Approval
            </h2>
            <div className="space-y-3">
              {pendingApprovals.map(po => (
                <div key={po.id} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-yellow-800">{po.id}</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                      Pending
                    </span>
                  </div>
                  <div className="text-sm text-yellow-700">
                    <div><strong>{po.product}</strong> × {po.quantity}</div>
                    <div className="mt-1">Vendor: {po.vendor} • ${po.amount}</div>
                    <div className="text-xs text-yellow-600 mt-1">Submitted {po.submitted}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="w-full mt-4 py-2 border-2 border-yellow-200 text-yellow-600 rounded-lg hover:bg-yellow-50 transition"
            >
              View All Purchase Orders
            </button>
          </div>
        </div>

        {/* Restrictions Info */}
        <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Store Manager Restrictions</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div>✘ Cannot create or manage user accounts (Admin only)</div>
                <div>✘ Cannot approve Purchase Orders - must request Admin approval</div>
                <div>✘ Cannot change system configuration or AI settings</div>
                <div>✘ Cannot access inventory from other warehouses</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default/Admin Dashboard
  return (
      <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">Real-time</label>
        <select
          value={realtimeMode}
          onChange={(e) => setRealtimeMode(e.target.value)}
          className="px-2 py-1 border rounded-md text-sm"
        >
          <option value="mock">Mock</option>
          <option value="ws">WebSocket</option>
          <option value="off">Off</option>
        </select>
        <label className="flex items-center gap-2 ml-3 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={saveToProfile}
            onChange={(e) => {
              const v = e.target.checked;
              setSaveToProfile(v);
              localStorage.setItem('dashboard_realtime_save', v ? 'true' : 'false');
              if (v) saveProfilePreference(realtimeMode);
            }}
            className="w-4 h-4"
          />
          <span>Save to profile</span>
        </label>
        <div className="text-xs text-gray-500">{wsStatus}</div>
      </div>
      <div className="flex space-x-6">
        <DashboardCard
          title="Total Products"
          value={products.length}
          onClick={() => navigate("/products")}
        />
        <DashboardCard
          title="Low Stock"
          value={lowStockCount}
          onClick={() => navigate("/products")}
        />
        <DashboardCard
          title="Suppliers"
          value={suppliers.length}
          onClick={() => navigate("/suppliers")}
        />
        <DashboardCard
          title="Purchase Orders"
          value={purchaseOrders.length}
          onClick={() => navigate("/transactions")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
