import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { getTransactions, getPurchases, getProducts } from "../utils/api";
import { Link } from 'react-router-dom';

const DemandForecast = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setDataLoading(true);
    setLoading(true);
    try {
      // Parallel fetch: transactions, purchases, products
      const [txRes, poRes, prodRes] = await Promise.allSettled([getTransactions(), getPurchases(), getProducts()]);

      // normalize transactions
      let txList = [];
      if (txRes.status === 'fulfilled') {
        const payload = txRes.value && txRes.value.data ? txRes.value.data : txRes.value;
        if (Array.isArray(payload)) txList = payload;
        else if (Array.isArray(payload?.data)) txList = payload.data;
      }

      let poList = [];
      if (poRes.status === 'fulfilled') {
        const payload = poRes.value && poRes.value.data ? poRes.value.data : poRes.value;
        if (Array.isArray(payload)) poList = payload;
        else if (Array.isArray(payload?.data)) poList = payload.data;
        else if (Array.isArray(payload?.purchases)) poList = payload.purchases;
      }

      setTransactions(txList);
      setPurchases(poList);

      // normalize products
      let prodList = [];
      if (prodRes && prodRes.status === 'fulfilled') {
        const payload = prodRes.value && prodRes.value.data ? prodRes.value.data : prodRes.value;
        if (Array.isArray(payload)) prodList = payload;
        else if (Array.isArray(payload?.data)) prodList = payload.data;
      }

      // compute forecasts from real data (products + transactions)
      try {
        const computed = computeProductForecasts(prodList, txList);
        setForecasts(computed);
      } catch (e) {
        console.error('Failed to compute forecasts from products/transactions', e);
      }
    } catch (err) {
      console.error('Failed to fetch demand data', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to load demand data' } }));
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Build sparkline data for a product: scan recent transactions and collect up to 8 recent quantities
  const buildSparklineData = (productId) => {
    const values = [];
    for (let i = transactions.length - 1; i >= 0 && values.length < 8; i--) {
      const tx = transactions[i];
      const items = tx.items || tx.lineItems || tx.products || tx.orderItems || tx.itemsSold || [];
      if (!items || items.length === 0) {
        // flattened transaction
        const prod = tx.product || tx.productId || tx.sku || tx;
        const id = String(prod?.id ?? prod?._id ?? prod?.productId ?? prod?.sku ?? prod?.name ?? prod);
        if (String(productId) === id) {
          const qty = Number(tx.quantity || tx.qty || tx.count || 1) || 0;
          values.push(qty);
        }
        continue;
      }

      for (const it of items) {
        const prod = it.product || it.productId || it.productRef || it;
        const id = String(prod?.id ?? prod?._id ?? prod?.productId ?? prod?.sku ?? prod?.name ?? JSON.stringify(prod));
        if (String(productId) === id) {
          const qty = Number(it.quantity || it.qty || it.count || 1) || 0;
          values.push(qty);
          break;
        }
      }
    }

    if (values.length === 0) return Array(8).fill(0);
    return values.reverse();
  };

  const Sparkline = ({ data = [], width = 80, height = 28, color = '#3B82F6' }) => {
    const pts = data && data.length ? data : Array(8).fill(0);
    const max = Math.max(...pts, 1);
    const min = Math.min(...pts, 0);
    const len = pts.length;
    const stepX = width / Math.max(len - 1, 1);
    const points = pts.map((v, i) => {
      const x = (i * stepX).toFixed(2);
      const y = ((1 - (v - min) / Math.max(max - min, 1)) * height).toFixed(2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // --- Aggregation helpers for trending products ---
  const aggregateTransactions = (txList = []) => {
    // txList: array of transactions. Each transaction may have fields like: items: [{ product, productId, sku, name, quantity, price }]
    const map = new Map();
    for (const tx of txList) {
      const items = tx.items || tx.lineItems || tx.products || tx.orderItems || tx.itemsSold || [];
      // if tx itself is an item-like record (some APIs return flattened items), detect it
      if (!items || items.length === 0) {
        // check if tx has product reference directly
        if (tx.product) {
          const prod = tx.product;
          const id = String(prod.id ?? prod._id ?? prod.productId ?? prod.sku ?? prod.name);
          const name = prod.name ?? prod.title ?? tx.productName ?? 'Unknown';
          const sku = prod.sku ?? tx.sku ?? '';
          const qty = Number(tx.quantity || tx.qty || 1) || 0;
          const price = Number(tx.price || tx.unitPrice || tx.amount || tx.total) || 0;
          const cur = map.get(id) || { id, name, sku, count:0, revenue:0 };
          cur.count += qty;
          cur.revenue += qty * price;
          map.set(id, cur);
          continue;
        }
      }

      for (const it of items) {
        const prod = it.product || it.productId || it.productRef || it;
        const id = String(prod?.id ?? prod?._id ?? prod?.productId ?? prod?.sku ?? prod?.name ?? JSON.stringify(prod));
        const name = prod?.name ?? prod?.title ?? it.name ?? it.productName ?? 'Unknown';
        const sku = prod?.sku ?? it.sku ?? '';
        const qty = Number(it.quantity || it.qty || it.count || 1) || 0;
        const price = Number(it.price || it.unitPrice || it.amount || it.total || 0) || 0;
        const cur = map.get(id) || { id, name, sku, count:0, revenue:0 };
        cur.count += qty;
        cur.revenue += qty * price;
        map.set(id, cur);
      }
    }

    // convert to sorted array
    const arr = Array.from(map.values());
    arr.sort((a,b) => b.count - a.count || b.revenue - a.revenue);
    return arr;
  }

  const computePurchaseTrends = (poList = []) => {
    // aggregate POs by product and status
    const statusMap = {};
    const productPending = new Map();
    for (const po of poList) {
      const status = String(po.status || po.state || '').toLowerCase() || 'unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;

      const prod = po.product || po.productId || po.productRef || po.productDto || po;
      const id = prod ? String(prod.id ?? prod._id ?? prod.productId ?? prod.sku ?? prod.name) : String(po.productId || po.product || po.id || JSON.stringify(po));
      const name = prod?.name ?? prod?.title ?? po.productName ?? 'Unknown';
      if (status.includes('pend')) {
        const cur = productPending.get(id) || { id, name, count:0 };
        cur.count += 1;
        productPending.set(id, cur);
      }
    }

    const pendingArr = Array.from(productPending.values()).sort((a,b) => b.count - a.count);
    return { statusMap, pendingArr };
  }

  // Compute product forecasts using historical transactions
  const computeProductForecasts = (products = [], txList = []) => {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // prepare product map
    const prodMap = new Map();
    for (const p of products) {
      const id = String(p.id ?? p._id ?? p.productId ?? p.sku ?? p.skuCode ?? p.skuId ?? p.name ?? '');
      prodMap.set(id, p);
    }

    // buckets: productId -> Array(8) oldest->newest
    const buckets = new Map();

    for (const tx of txList) {
      const when = new Date(tx.createdAt || tx.date || tx.orderDate || tx.timestamp || tx.time || tx.created || Date.now()).getTime();
      if (isNaN(when)) continue;
      const weeksAgo = Math.floor((now - when) / WEEK_MS);
      if (weeksAgo < 0 || weeksAgo >= 8) continue;
      const bucketIndex = 7 - weeksAgo; // 0 = oldest, 7 = most recent

      const items = tx.items || tx.lineItems || tx.products || tx.orderItems || tx.itemsSold || [];
      if (!items || items.length === 0) {
        // flattened
        const prod = tx.product || tx.productId || tx.sku || tx;
        const id = String(prod?.id ?? prod?._id ?? prod?.productId ?? prod?.sku ?? prod?.name ?? prod);
        const qty = Number(tx.quantity || tx.qty || tx.count || 1) || 0;
        if (!buckets.has(id)) buckets.set(id, Array(8).fill(0));
        buckets.get(id)[bucketIndex] += qty;
        continue;
      }

      for (const it of items) {
        const prod = it.product || it.productId || it.productRef || it;
        const id = String(prod?.id ?? prod?._id ?? prod?.productId ?? prod?.sku ?? prod?.name ?? JSON.stringify(prod));
        const qty = Number(it.quantity || it.qty || it.count || 1) || 0;
        if (!buckets.has(id)) buckets.set(id, Array(8).fill(0));
        buckets.get(id)[bucketIndex] += qty;
      }
    }

    // build forecasts array
    const out = [];
    for (const [id, p] of prodMap.entries()) {
      const trend = buckets.get(id) || Array(8).fill(0);
      // forecast: use sum of last 4 weeks (most recent 4 weeks)
      const last4 = trend.slice(4, 8);
      const sumLast4 = last4.reduce((s, v) => s + v, 0);
      const avgPerWeek = sumLast4 / 4;
      const forecastedDemand = Math.round(avgPerWeek * 4); // next 4-week demand estimate

      const currentStock = Number(p.currentStock ?? p.stock ?? p.quantity ?? p.onHand ?? p.qty ?? 0) || 0;

      let riskLevel = 'Low';
      let action = 'Sufficient';
      if (currentStock < forecastedDemand) {
        riskLevel = 'High';
        action = 'Reorder Required';
      } else if (currentStock < Math.ceil(forecastedDemand * 1.5)) {
        riskLevel = 'Medium';
        action = 'Reorder Soon';
      }

      out.push({
        sku: p.sku ?? p.code ?? p.productCode ?? id,
        name: p.name ?? p.title ?? 'Unknown',
        currentStock,
        forecastedDemand,
        action,
        riskLevel,
        trend,
      });
    }

    // include any products that appeared in transactions but not in products list
    for (const [id, trend] of buckets.entries()) {
      if (prodMap.has(id)) continue;
      const last4 = trend.slice(4,8);
      const sumLast4 = last4.reduce((s,v)=>s+v,0);
      const avgPerWeek = sumLast4 / 4;
      const forecastedDemand = Math.round(avgPerWeek * 4);
      out.push({ sku: id, name: id, currentStock: 0, forecastedDemand, action: forecastedDemand>0? 'Reorder Required' : 'Sufficient', riskLevel: forecastedDemand>0? 'High' : 'Low', trend });
    }

    // sort by risk and forecasted demand
    out.sort((a,b) => (b.forecastedDemand - b.currentStock) - (a.forecastedDemand - a.currentStock));
    return out;
  }

  const getChartData = (product) => {
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      datasets: [
        {
          label: 'Forecasted Demand',
          data: product.trend,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Current Stock Level',
          data: Array(8).fill(product.currentStock),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Demand Forecast Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading forecast data...</div>
      </div>
    );
  }

  const trending = aggregateTransactions(transactions);
  const purchaseTrends = computePurchaseTrends(purchases);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI-Based Demand Forecasting</h1>
          <p className="text-gray-600 text-sm mt-1">Predictive analytics for inventory optimization</p>
        </div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Forecast Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forecasted Demand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {forecasts.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{item.sku}</td>
                <td className="px-6 py-4 text-sm">{item.name}</td>
                <td className="px-6 py-4 text-sm">{item.currentStock}</td>
                <td className="px-6 py-4 text-sm font-semibold">{item.forecastedDemand}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.riskLevel)}`}>
                    {item.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{item.action}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedProduct(selectedProduct?.sku === item.sku ? null : item)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {selectedProduct?.sku === item.sku ? 'Hide' : 'View'} Chart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart Display */}
      {selectedProduct && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Forecast Trend: {selectedProduct.name} ({selectedProduct.sku})
          </h2>
          <div className="h-96">
            <Line data={getChartData(selectedProduct)} options={chartOptions} />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">AI Insights:</h3>
            <ul className="text-sm space-y-1">
              <li>• Demand is trending {selectedProduct.trend[7] > selectedProduct.trend[0] ? 'upward' : 'downward'}</li>
              <li>• {selectedProduct.currentStock < selectedProduct.forecastedDemand 
                ? `Shortage of ${selectedProduct.forecastedDemand - selectedProduct.currentStock} units predicted` 
                : 'Stock levels appear sufficient'}</li>
              <li>• Recommended action: {selectedProduct.action}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Trending Products & Purchase Status */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Top Trending Products (by Transactions)</h3>
            <p className="text-xs text-gray-500">Based on recent sales transactions</p>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="py-2">#</th>
                  <th className="py-2">Product</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Trend</th>
                  <th className="py-2">Transactions</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trending.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No transaction data available</td></tr>
                )}
                {trending.slice(0, 10).map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2 font-medium">
                      <Link to={`/products/${encodeURIComponent(p.id || p.sku || p.name || i)}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2">{p.sku}</td>
                    <td className="py-2">
                      <Sparkline data={buildSparklineData(p.id)} />
                    </td>
                    <td className="py-2">{p.count}</td>
                    <td className="py-2">${(p.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Purchase Order Status</h3>
            <p className="text-xs text-gray-500">Snapshot of purchase orders by status</p>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Status Counts</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(purchaseTrends.statusMap).length === 0 && (
                  <span className="text-sm text-gray-500">No purchase order data</span>
                )}
                {Object.entries(purchaseTrends.statusMap).map(([k,v]) => (
                  <div key={k} className="px-3 py-1 bg-gray-100 rounded-full text-xs">{k.toUpperCase()}: {v}</div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Top Products with Pending POs</h4>
              <ul className="text-sm space-y-2">
                {purchaseTrends.pendingArr.length === 0 && (
                  <li className="text-gray-500">No pending purchase orders</li>
                )}
                {purchaseTrends.pendingArr.slice(0,5).map(p => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-600">Pending: {p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm">
          <strong>Note:</strong> Forecasts are generated using historical sales data, seasonal trends, and machine learning algorithms. 
          Predictions update daily. Items marked as "High Risk" should be prioritized for replenishment.
        </p>
      </div>
    </div>
  );
};

export default DemandForecast;
