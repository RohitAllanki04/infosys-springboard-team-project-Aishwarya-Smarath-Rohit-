import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProducts, getSuppliers, createPurchase, getPurchaseById, updatePurchase, getUserById } from '../utils/api';
import { getProfileFromToken } from '../utils/auth';

export default function PurchaseOrderForm() {
  const { id } = useParams();
  const editing = !!id;
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ productId: '', vendorId: '', quantity: 1 });
  const navigate = useNavigate();
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorDetails, setVendorDetails] = useState(null);

  useEffect(() => {
    loadOptions();
    if (editing) loadExisting();
  }, []);

  async function loadOptions() {
    try {
      const p = await getProducts();
      setProducts(p?.data || []);
    } catch (e) {
      console.error('Failed to load products', e);
    }

    try {
      const s = await getSuppliers();
      setVendors(s?.data || []);
    } catch (e) {
      console.error('Failed to load vendors', e);
    }
  }

  async function loadExisting() {
    try {
      const res = await getPurchaseById(id);
      const p = res?.data;
      setForm({ productId: p?.product?.id ?? p?.product?.id ?? '', vendorId: p?.vendor?.id ?? '', quantity: p?.quantity ?? 1 });
    } catch (e) {
      console.error('Failed to load purchase', e);
    }
  }

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const viewVendor = async (id) => {
    if (!id) return;
    setVendorModalOpen(true);
    setVendorDetails(null);
    try {
      const res = await getUserById(id).catch(() => null);
      const v = res && res.data ? res.data : res;
      setVendorDetails(v || null);
    } catch (e) {
      console.error('Failed to load vendor', e);
      setVendorDetails(null);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send nested payload expected by backend: product and vendor objects
      const payload = {
        quantity: Number(form.quantity) || 1,
        status: 'PENDING',
        product: { id: form.productId },
        vendor: { id: form.vendorId },
      };

      if (editing) {
        await updatePurchase(id, payload);
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase updated' } }));
      } else {
        await createPurchase(payload);
        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase created' } }));
      }
      navigate('/purchases');
    } catch (err) {
      console.error('Create/Update purchase failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to save purchase' } }));
    }
  };

  // Pre-fill vendor for logged-in user if vendor role
  useEffect(() => {
    const profile = getProfileFromToken();
    if (profile?.id && !form.vendorId) {
      setForm((s) => ({ ...s, vendorId: profile.id }));
    }
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{editing ? 'Edit' : 'New'} Purchase</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Product</label>
          <select value={form.productId} onChange={handleChange('productId')} className="mt-1 block w-full border px-4 py-2 rounded hover:border-gray-400 focus:border-blue-500 transition">
            <option value="">Select product</option>
            {products.map(pd => (
              <option key={pd.id || pd._id} value={pd.id || pd._id}>{pd.name || pd.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Vendor</label>
          <div className="flex gap-2 items-center mt-1">
            <select value={form.vendorId} onChange={handleChange('vendorId')} className="block w-full border px-4 py-2 rounded hover:border-gray-400 focus:border-blue-500 transition">
              <option value="">Select vendor</option>
              {vendors.map(v => (
                <option key={v.id || v._id} value={v.id || v._id}>{v.fullName || v.name || v.email}</option>
              ))}
            </select>
            <button type="button" onClick={() => viewVendor(form.vendorId)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">View Vendor</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input type="number" value={form.quantity} onChange={handleChange('quantity')} className="mt-1 block w-32 border px-4 py-2 rounded hover:border-gray-400 focus:border-blue-500 transition" />
        </div>

        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" type="submit">Save</button>
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition" type="button" onClick={() => navigate('/purchases')}>Cancel</button>
        </div>
      </form>
        {vendorModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded shadow-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-2">Vendor Details</h3>
              {vendorDetails ? (
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {vendorDetails.fullName ?? vendorDetails.name}</div>
                  <div><strong>Email:</strong> {vendorDetails.email}</div>
                  <div><strong>Contact:</strong> {vendorDetails.contactNumber ?? vendorDetails.phone}</div>
                  <div><strong>Company:</strong> {vendorDetails.companyName}</div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
              <div className="mt-4 text-right">
                <button onClick={() => setVendorModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Close</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
