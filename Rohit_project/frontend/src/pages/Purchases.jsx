import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPurchases, getPurchaseById, updatePurchase } from '../utils/api';
import { getProfileFromToken } from '../utils/auth';
import { isAdmin, isStoreManager } from '../utils/roles';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'DISPATCHED'];

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function fetchPurchases() {
    setLoading(true);
    try {
      const profile = getProfileFromToken();
      const role = profile?.role || '';
      let res;
      if (isAdmin(role) || isStoreManager(role)) {
        res = await getPurchases();
      } else {
        // scope to vendor/user
        const vendorId = profile?.id;
        res = await getPurchases({ vendor_id: vendorId });
      }

      const data = res?.data || [];
      setPurchases(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error('Failed to load purchases', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to load purchases' } }));
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (purchaseId, newStatus) => {
    try {
      const existing = (await getPurchaseById(purchaseId)).data;
      // Build nested payload expected by backend
      const payload = {
        quantity: existing?.quantity ?? 1,
        status: newStatus,
        product: { id: existing?.product?.id ?? existing?.productId ?? existing?.product?._id },
        vendor: { id: existing?.vendor?.id ?? existing?.vendorId ?? existing?.vendor?._id },
      };

      await updatePurchase(purchaseId, payload);

      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Status updated' } }));
      fetchPurchases();
    } catch (err) {
      console.error('Status update failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to update status' } }));
    }
  };



  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Purchase Orders</h2>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id || p._id || p.id} className="border-t">
                  <td className="px-4 py-2">{p.product?.name ?? p.product?.title ?? (p.product || {}).name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-4 py-2 bg-gray-100 rounded">{p.status}</span>
                  </td>
                  <td className="px-4 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* vendor modal removed per request */}
    </div>
  );
}

function RoleStatusControl({ purchase, onChange }) {
  const profile = getProfileFromToken();
  const role = profile?.role || '';
  const canEdit = isAdmin(role) || isStoreManager(role);

  if (!canEdit) return null;

  return (
    <select
      value={purchase.status || 'PENDING'}
      onChange={(e) => onChange(purchase.id ?? purchase._id, e.target.value)}
      className="border px-4 py-2 rounded hover:border-gray-400 focus:border-blue-500 transition"
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}



