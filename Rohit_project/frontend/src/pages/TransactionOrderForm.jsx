import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProducts, getSuppliers } from '../utils/api';
import { createTransaction, getTransactionById, updateTransaction } from '../utils/transactionOrderApi';

const TransactionOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ quantity: '', type: 'IN', productId: '', vendorId: '', timestamp: new Date().toISOString() });

  useEffect(() => {
    loadLookups();
    if (id) loadTransaction(id);
  }, [id]);

  const loadLookups = async () => {
    try {
      const [pRes, sRes] = await Promise.all([getProducts(), getSuppliers()]);
      const pList = pRes && pRes.data ? pRes.data : pRes;
      const sList = sRes && sRes.data ? sRes.data : sRes;
      setProducts(Array.isArray(pList) ? pList : pList?.data || []);
      setVendors(Array.isArray(sList) ? sList : sList?.data || []);
    } catch (e) {
      console.error('Lookup failed', e);
    }
  };

  const loadTransaction = async (tid) => {
    setLoading(true);
    try {
      const res = await getTransactionById(tid);
      const t = res && res.data ? res.data : res;
      const normalized = t || {};
      setForm({
        quantity: normalized.quantity ?? normalized.qty ?? '',
        type: normalized.type ?? 'IN',
        productId: normalized.product?.id ?? normalized.productId ?? normalized.productId ?? '',
        vendorId: normalized.vendor?.id ?? normalized.vendorId ?? normalized.supplierId ?? '',
        timestamp: normalized.createdAt ?? normalized.date ?? new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to load transaction', e);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!form.quantity || !form.productId || !form.vendorId) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Please fill required fields' } }));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        quantity: Number(form.quantity),
        type: form.type,
        productId: form.productId,
        vendorId: form.vendorId,
        timestamp: form.timestamp,
      };
      if (id) {
        await updateTransaction(id, payload);
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Transaction updated' } }));
      } else {
        await createTransaction(payload);
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Transaction created' } }));
      }
      navigate('/transactions');
    } catch (e) {
      console.error('Save failed', e);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Save failed' } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{id ? 'Edit' : 'Create'} Transaction</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 max-w-xl">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition" required />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition">
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Product</label>
          <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition" required>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id ?? p._id ?? p.productId ?? p.sku} value={p.id ?? p._id ?? p.productId ?? p.sku}>{p.name ?? p.title ?? p.sku}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Vendor</label>
          <select value={form.vendorId} onChange={(e) => setForm({...form, vendorId: e.target.value})} className="w-full px-4 py-2 border rounded hover:border-gray-400 focus:border-blue-500 transition" required>
            <option value="">Select vendor</option>
            {vendors.map(v => <option key={v.id ?? v._id ?? v.vendorId} value={v.id ?? v._id ?? v.vendorId}>{v.fullName ?? v.name ?? v.companyName}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Timestamp</label>
          <input type="text" value={new Date(form.timestamp).toLocaleString()} readOnly className="w-full px-4 py-2 border rounded bg-gray-50" />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => navigate('/transactions')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default TransactionOrderForm;
