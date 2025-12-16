import React, { useState, useEffect } from 'react';

const RecentPurchases = () => {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const api = await import('../utils/api');
      let res = null;
      if (api.getAllPurchases) res = await api.getAllPurchases();
      else if (api.getPurchases) res = await api.getPurchases();

      const list = res ? (Array.isArray(res?.data) ? res.data : (res?.data?.purchases || res?.data || [])) : [];
      setOrders(list.slice(0, 5));
    } catch (err) {
      console.debug('[RecentPurchases] fetch failed', err);
      setError(err?.message || 'Failed to load purchases');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-5 transform hover:-translate-y-0.5 hover:shadow-lg transition">
      <h2 className="text-base font-semibold mb-3">Recent Purchase Orders</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading recent purchases…</div>
      ) : error ? (
        <div className="space-y-2">
          <div className="text-sm text-red-600">{error}</div>
          <button onClick={fetchOrders} className="px-2 py-1 text-xs bg-gray-100 rounded">Retry</button>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="text-sm text-gray-600">No recent purchases found.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((o, idx) => {
            const id = o.orderNumber || o.id || o._id || `PO-${idx}`;
            const qty = o.quantity ?? o.qty ?? 0;
            const vendor = (o.vendor && (o.vendor.name || o.vendor)) || o.supplier || 'Unknown';
            const status = (o.status || o.state || 'Pending').toString();
            const pill = status.toLowerCase().includes('pend') ? 'bg-orange-200 text-orange-800' : status.toLowerCase().includes('approve') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';

            return (
              <div key={id} className="flex items-center justify-between p-2 rounded">
                <div>
                  <div className="font-medium text-sm">{id}</div>
                  <div className="text-xs text-gray-600">{qty} units - Vendor: {vendor}</div>
                </div>
                <span className={`px-2 py-0.5 ${pill} text-xs font-medium rounded-full`}>{status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentPurchases;
