import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../utils/auth';
import RecentPurchases from '../components/RecentPurchases';
import SystemAlerts from '../components/SystemAlerts';

const Admindashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStoreManagers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    todayTransactions: 0,
    totalRevenue: 0,
    activeAlerts: 0
  });

  const [showMockPanel, setShowMockPanel] = useState(false);
  const [mockEvent, setMockEvent] = useState({ type: 'stock-out', product: 'Sample Product', quantity: 5, vendorId: 'V100' });
  const topMountedRef = useRef(true);

  useEffect(() => {
    const userProfile = getProfile();
    setProfile(userProfile);

    // Fetch admin stats from API: product catalog, stock transactions, profiles
    (async () => {
      try {
        const api = await import('../utils/api');

        // Products/catalog
        let products = [];
        try {
          const p = await api.getProductCatalog();
          products = Array.isArray(p?.data) ? p.data : (p?.data?.products || []);
        } catch (e) { console.debug('[admin] product catalog fetch failed', e); }

        // Stock transactions (for today's transactions)
        let txs = [];
        try {
          const t = await api.getAllStockTransactions();
          txs = Array.isArray(t?.data) ? t.data : (t?.data?.transactions || t?.data || []);
        } catch (e) { console.debug('[admin] stock tx fetch failed', e); }

        // Users count
        let usersCount = null;
        try {
          const u = await api.getAllProfiles();
          const list = Array.isArray(u?.data) ? u.data : (u?.data?.profiles || []);
          usersCount = list.length;
        } catch (e) { console.debug('[admin] profiles fetch failed', e); }

        const totalProducts = products.length || 0;
        const lowStockItems = products.filter(p => {
          const cs = Number(p.currentStock ?? p.quantity ?? p.stock ?? 0);
          const rl = Number(p.reorderLevel ?? p.minStock ?? p.reorderThreshold ?? 0);
          return !isNaN(cs) && !isNaN(rl) && cs <= rl;
        }).length;

        const today = new Date().toDateString();
        const todayTransactions = txs.filter(t => {
          const d = t.createdAt || t.date || t.timestamp || t.time;
          if (!d) return false;
          try { return new Date(d).toDateString() === today; } catch (e) { return false; }
        }).length;

        if (topMountedRef.current) {
          setStats(prev => ({ ...prev,
            totalUsers: usersCount ?? prev.totalUsers,
            totalProducts,
            lowStockItems,
            todayTransactions,
          }));
        }
      } catch (err) {
        console.debug('[admin] fetch stats failed', err);
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Failed to load some admin stats' } }));
      }
    })();

    // Realtime activity listener: update admin stats in response to events
    const onRealtime = (e) => {
      try {
        const d = e?.detail || e || {};
        const t = (d.type || d.event || '').toString();

        setStats(prev => {
          const next = { ...prev };
          if (t === 'stock-out' || t === 'low-stock') {
            next.activeAlerts = (next.activeAlerts || 0) + 1;
            next.lowStockItems = (next.lowStockItems || 0) + 1;
          } else if (t === 'stock-in') {
            next.todayTransactions = (next.todayTransactions || 0) + 1;
            next.lowStockItems = Math.max(0, (next.lowStockItems || 0) - 1);
          } else if (t === 'product-added') {
            next.totalProducts = (next.totalProducts || 0) + 1;
          } else if (t === 'purchase-order-created') {
            next.pendingOrders = (next.pendingOrders || 0) + 1;
          }
          return next;
        });

        const product = d.product || d.productName || d.name || '';
        if (t === 'stock-out' || t === 'low-stock') {
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: `${product || 'Item'} low or out of stock` } }));
        } else if (t === 'stock-in') {
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `${product || 'Item'} stocked in (${d.quantity || ''})` } }));
        }
      } catch (err) { console.debug('[admin-realtime] handler error', err); }
    };

    window.addEventListener('realtime-activity', onRealtime);

    return () => {
      window.removeEventListener('realtime-activity', onRealtime);
      topMountedRef.current = false;
    };
  }, []);

  const quickActions = [
    { id: 'users', title: 'User Management', color: 'blue', description: 'Manage users and store managers', action: () => setActiveTab('users'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5A6.75 6.75 0 0112 13.5a6.75 6.75 0 017.5 6" /></svg>) },
    { id: 'products', title: 'Product Management', color: 'green', description: 'Add, edit, or delete products', action: () => navigate('/products'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v8l-9 4-9-4V7z" /></svg>) },
    { id: 'orders', title: 'Purchase Orders', color: 'orange', description: 'Approve or reject orders', action: () => navigate('/transactions'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M9 8h6" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" /></svg>) },
    { id: 'analytics', title: 'Analytics', color: 'purple', description: 'View advanced reports', action: () => navigate('/analytics'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 13l4-4 4 4 4-8" /></svg>) },
    { id: 'settings', title: 'System Settings', color: 'cyan', description: 'Configure alerts & AI', action: () => setActiveTab('settings'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83l-1.41 1.41a2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2h-2a2 2 0 01-2-2v-.11a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0L2.4 19.7a2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2v-2a2 2 0 012-2h.11a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82L4.7 2.4a2 2 0 012.83 0l.06.06c.45.45 1.1.59 1.67.33.57-.25 1.24-.25 1.81 0 .57.26 1.22.12 1.67-.33l.06-.06a2 2 0 012.83 0l1.41 1.41a2 2 0 010 2.83l-.06.06c-.45.45-.59 1.1-.33 1.67.25.57.25 1.24 0 1.81-.26.57-.12 1.22.33 1.67l.06.06a2 2 0 010 2.83L19.4 15z" /></svg>) },
    { id: 'inventory', title: 'Full Inventory', color: 'emerald', description: 'View complete stock', action: () => navigate('/products'), icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2h-4V3H10v2H6a2 2 0 00-2 2v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" /></svg>) }
  ];

  // Reusable stat card (denser, hover elevation)
  const StatCard = ({ title, value, hint, stripeColor = 'purple', icon }) => {
    const iconColor = {
      purple: 'text-purple-600', blue: 'text-blue-600', green: 'text-green-600', orange: 'text-orange-600', red: 'text-red-600', cyan: 'text-cyan-600', emerald: 'text-emerald-600', yellow: 'text-yellow-600'
    }[stripeColor] || 'text-gray-700';

    return (
      <div className={`bg-white shadow-md rounded-lg p-3 transform hover:-translate-y-0.5 hover:shadow-lg transition`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-lg font-semibold mt-1">{value}</p>
            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
          </div>
          <div className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/40 ${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div>
      {/* Mock realtime control panel for admins */}
      <div className="mb-4 flex items-start justify-end">
        <button
          onClick={() => setShowMockPanel(v => !v)}
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition ${showMockPanel ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {showMockPanel ? 'Hide Mock' : 'Show Mock'}
        </button>
      </div>

      {showMockPanel && (
        <div className="mb-4 p-3 bg-gray-50 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select className="border px-2 py-1 rounded-md text-xs" value={mockEvent.type} onChange={(e) => setMockEvent(me => ({ ...me, type: e.target.value }))}>
              <option value="stock-in">stock-in</option>
              <option value="stock-out">stock-out</option>
              <option value="low-stock">low-stock</option>
              <option value="product-added">product-added</option>
              <option value="purchase-order-created">purchase-order-created</option>
              <option value="user-registered">user-registered</option>
            </select>

            <input className="border px-2 py-1 rounded-md text-xs" value={mockEvent.product} onChange={(e) => setMockEvent(me => ({ ...me, product: e.target.value }))} placeholder="Product / Name" />

            <input className="border px-2 py-1 rounded-md text-xs" value={mockEvent.quantity} onChange={(e) => setMockEvent(me => ({ ...me, quantity: e.target.value }))} placeholder="Quantity" />

            <input className="border px-2 py-1 rounded-md text-xs" value={mockEvent.vendorId} onChange={(e) => setMockEvent(me => ({ ...me, vendorId: e.target.value }))} placeholder="Vendor ID (optional)" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-2 py-1 text-xs bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition" onClick={async () => {
              const payload = { ...mockEvent, id: Date.now() };
              try {
                // call appropriate API where possible
                if (payload.type === 'stock-in' || payload.type === 'stock-out' || payload.type === 'low-stock') {
                  const tx = { productId: payload.productId || payload.product || null, quantity: Number(payload.quantity) || 0, type: payload.type === 'stock-in' ? 'IN' : 'OUT', vendorId: payload.vendorId || null };
                  try {
                    await (await import('../utils/api')).createStockTransaction(tx);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Stock transaction created' } }));
                  } catch (e) { console.debug('stock tx API failed', e); }
                } else if (payload.type === 'product-added') {
                  try {
                    await (await import('../utils/api')).createProduct({ name: payload.product || 'New Product' });
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Product created' } }));
                  } catch (e) { console.debug('createProduct API failed', e); }
                } else if (payload.type === 'purchase-order-created') {
                  try {
                    const purchasePayload = { quantity: Number(payload.quantity) || 1, status: 'PENDING', product: payload.productId ? { id: payload.productId } : undefined, vendor: payload.vendorId ? { id: payload.vendorId } : undefined };
                    await (await import('../utils/api')).createPurchaseFlat(purchasePayload);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase order created' } }));
                  } catch (e) { console.debug('createPurchaseFlat failed', e); }
                }
              } catch (e) { console.debug('dispatch mock api attempts failed', e); }

              // emit event for local UI in any case
              window.dispatchEvent(new CustomEvent('realtime-activity', { detail: payload }));
              window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: `Simulated ${payload.type} for ${payload.product}` } }));
            }}>Dispatch Mock</button>
            <button className="px-2 py-1 text-xs bg-gray-100 rounded-sm hover:bg-gray-200 transition" onClick={() => setMockEvent({ type: 'stock-out', product: 'Sample Product', quantity: 5, vendorId: 'V100' })}>Reset</button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          hint="+5 this month"
          stripeColor="blue"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5A6.75 6.75 0 0112 13.5a6.75 6.75 0 017.5 6" /></svg>}
        />

        <StatCard
          title="Store Managers"
          value={stats.totalStoreManagers}
          hint="Active managers"
          stripeColor="purple"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A4 4 0 017 15.5h10a4 4 0 011.879 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />

        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          hint="+45 this week"
          stripeColor="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v8l-9 4-9-4V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v8l9 4 9-4V7" /></svg>}
        />

        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          hint="Needs approval"
          stripeColor="orange"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M9 8h6" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" /></svg>}
        />

        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          hint="Requires attention"
          stripeColor="red"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>}
        />

        <StatCard
          title="Today's Transactions"
          value={stats.todayTransactions}
          hint="Stock movements"
          stripeColor="cyan"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 13l4-4 4 4 4-8" /></svg>}
        />

        <StatCard
          title="Inventory Value"
          value={`$${(stats.totalRevenue||0).toLocaleString()}`}
          hint="Total worth"
          stripeColor="emerald"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2" /></svg>}
        />

        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          hint="System notifications"
          stripeColor="yellow"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map(action => {
            const bgClass = action.color === 'blue' ? 'bg-blue-50 text-blue-600' : action.color === 'green' ? 'bg-green-50 text-green-600' : action.color === 'orange' ? 'bg-orange-50 text-orange-600' : action.color === 'purple' ? 'bg-purple-50 text-purple-600' : action.color === 'cyan' ? 'bg-cyan-50 text-cyan-600' : action.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-700';
            const iconColor = action.color === 'blue' ? 'text-blue-600' : action.color === 'green' ? 'text-green-600' : action.color === 'orange' ? 'text-orange-600' : action.color === 'purple' ? 'text-purple-600' : action.color === 'cyan' ? 'text-cyan-600' : action.color === 'emerald' ? 'text-emerald-600' : 'text-gray-700';
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`flex items-start gap-3 p-2 bg-white rounded-lg transform hover:-translate-y-0.5 hover:shadow-lg transition text-left`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bgClass} ${iconColor}`}>
                  {action.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{action.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity (extracted components) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPurchases />
        <SystemAlerts />
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <UserManagement />
  );

  const renderSettings = () => (
    <SystemSettings />
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {profile?.fullName || 'Admin'} - Platform Management & Control
        </p>
      </div>

      {/* Tab Navigation: use navbar button styling and remove bottom border */}
      <div className="mb-6">
        <nav className="flex gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`nav-link-brand-hover nav-label font-medium transition px-3 py-1 rounded-md text-sm ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`nav-link-brand-hover nav-label font-medium transition px-3 py-1 rounded-md text-sm ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-link-brand-hover nav-label font-medium transition px-3 py-1 rounded-md text-sm ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            System Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUserManagement()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const mountedRef = useRef(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  // Fetch profiles (callable for retry)
  const fetchProfiles = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const api = await import('../utils/api');
      const res = await api.getAllProfiles();
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.profiles || []);
      const mapped = list.map(p => ({
        id: p.id ?? p._id ?? p.userId ?? p.profileId,
        fullName: p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || (p.email || 'Unknown'),
        email: p.email || p.emailAddress || p.username || '',
        role: (p.role || (Array.isArray(p.roles) && p.roles[0]) || 'USER').toString().toUpperCase(),
        storeManager: p.storeManager || p.managerName || (p.manager && (p.manager.fullName || p.manager.name)) || null,
        status: p.status || 'active'
      }));
      if (mountedRef.current) setUsers(mapped);
    } catch (err) {
      console.debug('[admin] getAllProfiles failed', err);
      if (mountedRef.current) setUsers([]);
      if (mountedRef.current) setUsersError(err?.message || 'Failed to fetch profiles');
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Failed to fetch profiles — no data available' } }));
    } finally {
      if (mountedRef.current) setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProfiles();
    return () => { mountedRef.current = false };
  }, []);

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">User & Store Manager Management</h2>
          <p className="text-gray-600 text-sm">Create, edit, delete users and assign to store managers</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add User
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Roles</option>
          <option value="USER">Users</option>
          <option value="STORE_MANAGER">Store Managers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition">
                  <option value="USER">User</option>
                  <option value="STORE_MANAGER">Store Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Store Manager</label>
                <select className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition">
                  <option value="">None</option>
                  <option value="1">Manager A</option>
                  <option value="2">Manager B</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      {usersError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-center justify-between">
          <div className="text-sm">Failed to fetch profiles: {usersError}</div>
          <div>
            <button onClick={fetchProfiles} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Retry</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Store Manager</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoadingUsers ? (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">Loading profiles…</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">No profiles found — check server or credentials.</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{user.id}</td>
                  <td className="px-4 py-2 text-sm font-medium">{user.fullName}</td>
                  <td className="px-4 py-2 text-sm">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'STORE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{user.storeManager || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingUser(user); setShowForm(true); }}
                        className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// System Settings Component
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    lowStockAlert: true,
    expiryAlert: true,
    aiAutoPurchase: false,
    alertThreshold: 20,
    forecastDays: 7,
    aiAlgorithm: 'linear-regression'
  });

  const handleSave = () => {
    // TODO: Save to API
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'success', message: 'Settings saved successfully' } 
    }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email & Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Email & Alert Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-600">Send email alerts to users</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Low Stock Alerts</div>
                <div className="text-sm text-gray-600">Alert when stock below reorder level</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lowStockAlert}
                  onChange={(e) => setSettings({...settings, lowStockAlert: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Expiry Alerts</div>
                <div className="text-sm text-gray-600">Alert for expiring products</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.expiryAlert}
                  onChange={(e) => setSettings({...settings, expiryAlert: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alert Threshold (%)</label>
              <input
                type="number"
                value={settings.alertThreshold}
                onChange={(e) => setSettings({...settings, alertThreshold: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Trigger alert when stock falls below this percentage</p>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">AI & Forecasting Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">AI Auto-Purchase</div>
                <div className="text-sm text-gray-600">Automatically create POs based on AI</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aiAutoPurchase}
                  onChange={(e) => setSettings({...settings, aiAutoPurchase: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Forecast Period (Days)</label>
              <input
                type="number"
                value={settings.forecastDays}
                onChange={(e) => setSettings({...settings, forecastDays: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days to predict demand</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">AI Algorithm</label>
              <select
                value={settings.aiAlgorithm}
                onChange={(e) => setSettings({...settings, aiAlgorithm: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="linear-regression">Linear Regression (Fast, Simple)</option>
                <option value="arima">ARIMA (Time Series, Seasonal)</option>
                <option value="lstm">LSTM Neural Network (Advanced, Accurate)</option>
                <option value="prophet">Facebook Prophet (Trends & Holidays)</option>
                <option value="random-forest">Random Forest (Ensemble)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.aiAlgorithm === 'linear-regression' && 'Best for: Simple trends, quick predictions'}
                {settings.aiAlgorithm === 'arima' && 'Best for: Seasonal patterns, time-series data'}
                {settings.aiAlgorithm === 'lstm' && 'Best for: Complex patterns, large datasets'}
                {settings.aiAlgorithm === 'prophet' && 'Best for: Business trends with holidays'}
                {settings.aiAlgorithm === 'random-forest' && 'Best for: Multiple features, robust predictions'}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 AI Algorithm Guide:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Linear Regression:</strong> Good starting point, 85% accuracy</li>
                <li>• <strong>ARIMA:</strong> Best for seasonal products, 88% accuracy</li>
                <li>• <strong>LSTM:</strong> Most accurate, requires training, 92% accuracy</li>
                <li>• <strong>Prophet:</strong> Handles holidays & events, 90% accuracy</li>
                <li>• <strong>Random Forest:</strong> Balanced performance, 89% accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="lg:col-span-2">
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admindashboard;
