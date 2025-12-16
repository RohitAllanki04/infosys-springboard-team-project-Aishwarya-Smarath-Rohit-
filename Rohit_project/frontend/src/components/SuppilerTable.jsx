import React, { useEffect, useState } from "react";

const SupplierTable = ({ suppliers: initialSuppliers = [] }) => {
  const [suppliers, setSuppliers] = useState(initialSuppliers || []);
  const [showMock, setShowMock] = useState(false);
  const [mock, setMock] = useState({ type: 'supplier-added', id: '', name: '', contact: '', email: '', product: '', quantity: 1 });

  useEffect(() => {
    setSuppliers(initialSuppliers || []);
  }, [initialSuppliers]);

  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || e || {};
      const t = (d.type || d.event || '').toString();

      // If supplier added or updated, merge into table
      if (t === 'supplier-added' || t === 'supplier-updated') {
        const id = d.id || d.supplierId || d.vendorId || d.vendor_id || d.vendor || null;
        const updated = {
          id: id || (d.id ?? Math.random().toString(36).slice(2,8)),
          name: d.name || d.fullName || d.vendorName || d.vendor || 'Unknown',
          contact: d.contact || d.phone || d.contactNumber || '',
          email: d.email || d.emailAddress || '',
          lastActivity: `${t} ${d.product ? `(${d.product})` : ''}`,
          lastAt: new Date().toISOString()
        };

        setSuppliers(prev => {
          const found = prev.find(s => String(s.id) === String(updated.id));
          if (found) {
            return prev.map(s => String(s.id) === String(updated.id) ? { ...s, ...updated } : s);
          }
          return [updated, ...prev];
        });
      }

      // If activity refers to a vendor/supplier via vendorId, annotate lastActivity
      if (d.vendorId || d.vendor_id || d.vendor) {
        const vid = d.vendorId || d.vendor_id || d.vendor;
        setSuppliers(prev => prev.map(s => (String(s.id) === String(vid) ? { ...s, lastActivity: d.type || d.event || 'activity', lastAt: new Date().toISOString() } : s)));
      }
    };

    window.addEventListener('realtime-activity', handler);
    return () => window.removeEventListener('realtime-activity', handler);
  }, []);

  const simulate = async () => {
    const payload = { ...mock };
    if (!payload.id) payload.id = (Math.floor(Math.random() * 9000) + 1000).toString();

    // Best-effort: call backend endpoints where appropriate, then emit realtime event for local UI
    try {
      if (payload.type === 'supplier-added') {
        // create supplier on backend
        const body = { name: payload.name || payload.vendorName || payload.product || `Supplier ${payload.id}`, contact: payload.contact, email: payload.email };
        try {
          const res = await (await import('../utils/api')).createSupplier(body);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Supplier created (${res?.data?.id ?? payload.id})` } }));
        } catch (err) {
          console.debug('createSupplier failed (mock simulate)', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Supplier creation failed — falling back to local simulate' } }));
        }
      } else if (payload.type === 'supplier-updated') {
        const id = payload.id;
        const body = { name: payload.name, contact: payload.contact, email: payload.email };
        try {
          await (await import('../utils/api')).updateSupplier(id, body);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Supplier ${id} updated` } }));
        } catch (err) {
          console.debug('updateSupplier failed (mock simulate)', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Supplier update failed — falling back to local simulate' } }));
        }
      } else if (payload.type === 'stock-in' || payload.type === 'stock-out' || payload.type === 'low-stock') {
        // create a stock transaction to reflect activity
        const tx = { productId: payload.productId || payload.product || null, quantity: Number(payload.quantity) || 0, type: payload.type === 'stock-in' ? 'IN' : 'OUT', vendorId: payload.vendorId || null };
        try {
          await (await import('../utils/api')).createStockTransaction(tx);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Stock transaction (${payload.type}) recorded` } }));
        } catch (err) {
          console.debug('createStockTransaction failed (mock simulate)', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Stock transaction API failed — falling back to local simulate' } }));
        }
      }
    } catch (e) {
      console.debug('simulate api attempts error', e);
    }

    // always emit the realtime-activity for local demo behavior
    window.dispatchEvent(new CustomEvent('realtime-activity', { detail: payload }));
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: `Simulated ${payload.type} for ${payload.name || payload.product || payload.id}` } }));
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Suppliers</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMock(v => !v)} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">{showMock ? 'Hide Mock' : 'Show Mock'}</button>
        </div>
      </div>

      {showMock && (
        <div className="mb-4 p-3 bg-gray-50 border rounded">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Event Type</label>
            <select className="border px-2 py-1 rounded text-sm" value={mock.type} onChange={e => setMock(m => ({ ...m, type: e.target.value }))}>
              <option value="supplier-added">supplier-added</option>
              <option value="supplier-updated">supplier-updated</option>
              <option value="stock-out">stock-out</option>
              <option value="low-stock">low-stock</option>
            </select>

            <label className="text-xs">Supplier ID</label>
            <input className="border px-2 py-1 rounded text-sm" value={mock.id} onChange={e => setMock(m => ({ ...m, id: e.target.value }))} />

            <label className="text-xs">Name</label>
            <input className="border px-2 py-1 rounded text-sm" value={mock.name} onChange={e => setMock(m => ({ ...m, name: e.target.value }))} />

            <label className="text-xs">Contact</label>
            <input className="border px-2 py-1 rounded text-sm" value={mock.contact} onChange={e => setMock(m => ({ ...m, contact: e.target.value }))} />

            <label className="text-xs">Email</label>
            <input className="border px-2 py-1 rounded text-sm" value={mock.email} onChange={e => setMock(m => ({ ...m, email: e.target.value }))} />

            <label className="text-xs">Product (optional)</label>
            <input className="border px-2 py-1 rounded text-sm" value={mock.product} onChange={e => setMock(m => ({ ...m, product: e.target.value }))} />
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={simulate} className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">Simulate</button>
            <button onClick={() => { setMock({ type: 'supplier-added', id: '', name: '', contact: '', email: '', product: '', quantity: 1 }); }} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200">Reset</button>
          </div>
        </div>
      )}

      <table className="min-w-full border border-gray-200 rounded-xl">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Contact</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length > 0 ? (
            suppliers.map((s, i) => (
              <tr
                key={s.id ?? i}
                className="hover:bg-gray-50 transition border-b border-gray-100"
              >
                <td className="px-4 py-2">{s.id}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.contact}</td>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{s.lastActivity ? `${s.lastActivity} • ${new Date(s.lastAt).toLocaleTimeString()}` : '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;
