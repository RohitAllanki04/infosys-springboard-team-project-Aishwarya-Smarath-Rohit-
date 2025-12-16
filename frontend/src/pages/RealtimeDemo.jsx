import React, { useState } from 'react';

export default function RealtimeDemo() {
  const [type, setType] = useState('stock-in');
  const [product, setProduct] = useState('Demo Product');
  const [qty, setQty] = useState(5);
  const [vendor, setVendor] = useState('1');

  const sendEvent = async () => {
    const payload = { type, product, quantity: Number(qty), vendorId: vendor };
    try {
      // Try to call backend APIs depending on event type
      if (type === 'stock-in' || type === 'stock-out' || type === 'low-stock') {
        const tx = { productId: product || null, quantity: Number(qty) || 0, type: type === 'stock-in' ? 'IN' : 'OUT', vendorId: vendor || null };
        try {
          const api = await import('../utils/api');
          const res = await api.createStockTransaction(tx);
          const detail = res?.data || { ...tx, id: Date.now() };
          window.dispatchEvent(new CustomEvent('realtime-activity', { detail }));
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Stock transaction recorded` } }));
          return;
        } catch (err) {
          console.debug('createStockTransaction failed', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Stock API failed — falling back to local event' } }));
        }
      } else if (type === 'product-added') {
        try {
          const api = await import('../utils/api');
          const res = await api.createProduct({ name: product });
          const detail = res?.data || { id: Date.now(), type: 'product-added', product };
          window.dispatchEvent(new CustomEvent('realtime-activity', { detail }));
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Product created' } }));
          return;
        } catch (err) {
          console.debug('createProduct failed', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Create product API failed — falling back to local event' } }));
        }
      } else if (type === 'purchase-order-created') {
        try {
          const api = await import('../utils/api');
          const payload = { quantity: Number(qty) || 1, status: 'PENDING', product: product ? { id: product } : undefined, vendor: vendor ? { id: vendor } : undefined };
          const res = await api.createPurchaseFlat(payload);
          const detail = res || { id: Date.now(), type: 'purchase-order-created', product, quantity: Number(qty) };
          window.dispatchEvent(new CustomEvent('realtime-activity', { detail }));
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase order created' } }));
          return;
        } catch (err) {
          console.debug('createPurchaseFlat failed', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Create purchase API failed — falling back to local event' } }));
        }
      }
    } catch (e) {
      console.debug('sendEvent unexpected error', e);
    }

    // fallback: emit local event if API wasn't called or failed
    const detail = { id: Date.now(), ...payload, time: 'now' };
    window.dispatchEvent(new CustomEvent('realtime-activity', { detail }));
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: `Dispatched ${type} for ${product}` } }));
  };

  const openConfirm = async () => {
    const res = await window.showConfirm({ message: `Create PO for ${product}?`, mockData: { type: 'stock-out', product, productId: null, quantity: Number(qty), vendorId: vendor } });
    // show result
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: res ? 'Confirmed' : 'Cancelled' } }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Realtime Demo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium">Event Type</label>
          <select className="mt-1 block w-full border px-3 py-2 rounded" value={type} onChange={e => setType(e.target.value)}>
            <option value="stock-in">stock-in</option>
            <option value="stock-out">stock-out</option>
            <option value="product-added">product-added</option>
            <option value="low-stock">low-stock</option>
          </select>

          <label className="block text-sm font-medium mt-3">Product</label>
          <input className="mt-1 block w-full border px-3 py-2 rounded" value={product} onChange={e => setProduct(e.target.value)} />

          <label className="block text-sm font-medium mt-3">Quantity</label>
          <input type="number" className="mt-1 block w-32 border px-3 py-2 rounded" value={qty} onChange={e => setQty(e.target.value)} />

          <label className="block text-sm font-medium mt-3">Vendor ID</label>
          <input className="mt-1 block w-32 border px-3 py-2 rounded" value={vendor} onChange={e => setVendor(e.target.value)} />

          <div className="mt-4 flex gap-2">
            <button onClick={sendEvent} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Dispatch Event</button>
            <button onClick={openConfirm} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition">Open Confirm</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ol className="text-sm list-decimal list-inside space-y-1">
            <li>Use <strong>Dispatch Event</strong> to emit a `realtime-activity` event application-wide.</li>
            <li>Use <strong>Open Confirm</strong> to open the confirm dialog pre-filled with mock data and optionally create a PO on confirm.</li>
            <li>To see inline toasts, keep the Confirm dialog open and dispatch an event.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
