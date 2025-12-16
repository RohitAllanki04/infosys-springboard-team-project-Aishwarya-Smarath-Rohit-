import React, { useState, useEffect, useRef } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { getProducts, getPurchases } from "../utils/api";

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const mountedRef = useRef(true);

  // Mock data - replace with actual API calls
  const inventoryTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Stock Level',
        data: [1200, 1350, 1100, 1450, 1600, 1550, 1700, 1650, 1800, 1750, 1900, 1850],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const purchaseVsSalesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Purchases',
        data: [450, 520, 380, 610, 550, 620, 580, 640, 590, 660, 620, 700],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Sales',
        data: [380, 420, 350, 540, 480, 560, 520, 580, 530, 600, 560, 650],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      }
    ]
  };

  const categoryDistributionData = {
    labels: ['Electronics', 'Furniture', 'Clothing', 'Food & Beverages', 'Others'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      }
    ]
  };

  const topRestockedData = {
    labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
    datasets: [
      {
        label: 'Purchase Count',
        data: [45, 38, 32, 28, 22],
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // --- Dynamic data helpers ---
  const computeTotals = (list) => {
    const totalProducts = Array.isArray(list) ? list.length : 0;
    const totalUnits = (Array.isArray(list) ? list.reduce((s, p) => s + (Number(p.currentStock) || 0), 0) : 0);
    const lowStockItems = (Array.isArray(list) ? list.filter(p => {
      const cs = typeof p.currentStock === 'number' ? p.currentStock : Number(p.currentStock || 0);
      const rl = typeof p.reorderLevel === 'number' ? p.reorderLevel : Number(p.reorderLevel || 0);
      return rl > 0 && cs < rl;
    }).length : 0);

    // collect price candidates across common fields
    const priceCandidates = [];
    if (Array.isArray(list)) {
      for (const p of list) {
        const price = p.price ?? p.unitPrice ?? p.cost ?? p.listPrice ?? p.estimatedPrice ?? null;
        if (price != null && !Number.isNaN(Number(price))) priceCandidates.push(Number(price));
      }
    }

    let totalValue = 0;
    let avgUsed = false;
    let avgPrice = null;

    if (priceCandidates.length > 0) {
      // compute per-product value where available
      avgPrice = priceCandidates.reduce((a,b) => a + b, 0) / priceCandidates.length;
      for (const p of list || []) {
        const price = p.price ?? p.unitPrice ?? p.cost ?? p.listPrice ?? p.estimatedPrice ?? null;
        if (price != null && !Number.isNaN(Number(price))) {
          totalValue += Number(price) * (Number(p.currentStock) || 0);
        } else {
          // fallback to average for products missing price
          totalValue += avgPrice * (Number(p.currentStock) || 0);
          avgUsed = true;
        }
      }
    } else {
      // no price fields at all — use a conservative default average unit price
      const DEFAULT_UNIT_PRICE = 20; // configurable if you want
      avgPrice = DEFAULT_UNIT_PRICE;
      totalValue = avgPrice * totalUnits;
      avgUsed = true;
    }

    return { totalProducts, totalUnits, lowStockItems, totalValue: Number(totalValue), avgUsed, avgPrice };
  }

  const buildCategoryDistribution = (list) => {
    const map = new Map();
    (list || []).forEach(p => {
      const cat = (p.category || 'Uncategorized');
      const cur = Number(p.currentStock) || 0;
      map.set(cat, (map.get(cat) || 0) + cur);
    });
    const labels = Array.from(map.keys());
    const data = Array.from(map.values());
    return { labels, data };
  }

  const buildTopStocked = (list, topN = 5) => {
    const arr = Array.isArray(list) ? [...list] : [];
    arr.sort((a,b) => (Number(b.currentStock) || 0) - (Number(a.currentStock) || 0));
    const top = arr.slice(0, topN);
    return { labels: top.map(p => p.name ?? p.title ?? (p.sku ?? 'Item')), datasets: [{ label: 'Stock', data: top.map(p => Number(p.currentStock) || 0), backgroundColor: 'rgba(139, 92, 246, 0.7)' }] };
  }

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      const payload = res && res.data ? res.data : null;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.data)) list = payload.data;
      else if (Array.isArray(payload?.products)) list = payload.products;
      else list = [];
      if (!mountedRef.current) return;
      setProducts(list);
    } catch (err) {
      console.error('Analytics: getProducts failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to load products for analytics' } }));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const fetchPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const res = await getPurchases();
      const payload = res && res.data ? res.data : null;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.data)) list = payload.data;
      else if (Array.isArray(payload?.purchases)) list = payload.purchases;
      else list = [];

      // aggregate by status
      let total = list.length;
      let pending = 0;
      let approved = 0;
      for (const it of list) {
        const s = (String(it.status || it.state || '')).toLowerCase();
        if (s.includes('pend')) pending++;
        else if (s.includes('approve') || s.includes('approved')) approved++;
      }
      if (!mountedRef.current) return;
      setPurchaseStats({ total, pending, approved });
    } catch (err) {
      console.error('Analytics: getPurchases failed', err);
    } finally {
      if (mountedRef.current) setPurchasesLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts();
    fetchPurchases();
    const pid = setInterval(fetchProducts, 10000); // poll products every 10s
    const rid = setInterval(fetchPurchases, 30000); // poll purchases every 30s
    return () => { mountedRef.current = false; clearInterval(pid); clearInterval(rid); };
  }, []);

  const exportReport = (format) => {
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'success', message: `Report exported as ${format.toUpperCase()}` } 
    }));
    // Implement actual export logic here
  };

  // derived dynamic values
  const { totalProducts, totalUnits, lowStockItems, totalValue, avgUsed, avgPrice } = computeTotals(products);
  const catDist = buildCategoryDistribution(products);
  const topStocked = buildTopStocked(products, 5);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Inventory trends and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={() => exportReport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📊 Export Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards (dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Inventory Value</div>
          <div className="text-2xl font-bold mt-2">{totalValue == null ? '—' : `$${Number(totalValue).toLocaleString()}`}</div>
          <div className="text-xs text-gray-600 mt-1">{totalValue == null ? 'Value unavailable' : (avgUsed ? `Estimated using avg $${Number(avgPrice).toFixed(2)} per unit` : 'Inventory value from product price fields')}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold mt-2">{loading ? '...' : totalProducts}</div>
          <div className="text-xs text-blue-600 mt-1">{loading ? 'Loading…' : `${totalUnits.toLocaleString()} units in stock`}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Purchase Orders</div>
          <div className="text-2xl font-bold mt-2">{purchasesLoading ? '...' : purchaseStats.total}</div>
          <div className="text-xs text-orange-600 mt-1">{purchasesLoading ? '' : `${purchaseStats.pending} pending • ${purchaseStats.approved} approved`}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Low Stock Items</div>
          <div className="text-2xl font-bold mt-2">{loading ? '...' : lowStockItems}</div>
          <div className="text-xs text-red-600 mt-1">{loading ? '' : 'Requires attention'}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Trend */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory Level Trend</h2>
          <div className="h-72">
            {loading && products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart data…</div>
            ) : (
              <Line data={inventoryTrendData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Purchase vs Sales */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Purchase vs Sales Comparison</h2>
          <div className="h-72">
            {loading && products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart data…</div>
            ) : (
              <Bar data={purchaseVsSalesData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory by Category</h2>
          <div className="h-72 flex items-center justify-center">
            {loading && products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart data…</div>
            ) : (
              <Pie data={{ labels: catDist.labels.length ? catDist.labels : categoryDistributionData.labels, datasets: [{ data: catDist.data.length ? catDist.data : categoryDistributionData.datasets[0].data, backgroundColor: categoryDistributionData.datasets[0].backgroundColor }] }} options={{...chartOptions, maintainAspectRatio: true}} />
            )}
          </div>
        </div>

        {/* Top Purchased Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top Purchased Items</h2>
          <div className="h-72">
            {loading && products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart data…</div>
            ) : (
              <Bar 
                data={topStocked}
                options={{
                  ...chartOptions,
                  indexAxis: 'y',
                }} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Purchase vs Demand Visual */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Purchase vs Forecasted Demand</h2>
        <div className="h-80">
          <Line 
            data={{
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
              datasets: [
                {
                  label: 'Purchase Quantity',
                  data: [320, 280, 340, 310, 350, 330, 360, 340],
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  tension: 0.4,
                },
                {
                  label: 'Forecasted Demand',
                  data: [300, 290, 330, 320, 340, 345, 355, 350],
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  tension: 0.4,
                }
              ]
            }} 
            options={chartOptions} 
          />
        </div>
      </div>

      {/* Insights Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <h3 className="font-semibold text-green-800 mb-2">✓ Positive Trends</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Inventory turnover improved by 18%</li>
            <li>• Stockout incidents reduced by 22%</li>
            <li>• Purchase accuracy at 94%</li>
          </ul>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠ Areas to Monitor</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 34 items below reorder level</li>
            <li>• 12 items with declining demand</li>
            <li>• 5 slow-moving products</li>
          </ul>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Recommendations</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Increase safety stock for Electronics</li>
            <li>• Review pricing for slow movers</li>
            <li>• Schedule vendor meetings for Q4</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
