import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts, getSuppliers } from '../utils/api';
import { getAllTransactions, getTransactionsByVendorId, deleteTransaction } from '../utils/transactionOrderApi';
import { getProfile } from '../utils/auth';

const TransactionOrderList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadLookups();
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const vendorId = searchParams.get('vendorId');
      let res;
      if (vendorId) {
        res = await getTransactionsByVendorId(vendorId);
      } else {
        res = await getAllTransactions();
      }
      const list = res && res.data ? res.data : res;
      setTransactions(Array.isArray(list) ? list : list?.data || []);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [pRes, sRes] = await Promise.all([getProducts(), getSuppliers()]);
      const pList = pRes && pRes.data ? pRes.data : pRes;
      const sList = sRes && sRes.data ? sRes.data : sRes;
      setProducts(Array.isArray(pList) ? pList : pList?.data || []);
      setVendors(Array.isArray(sList) ? sList : sList?.data || []);
    } catch (e) {
      // ignore lookup failures
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Transaction deleted' } }));
      fetchList();
    } catch (e) {
      console.error('Delete failed', e);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Delete failed' } }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/transactions/create')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">+ New Transaction</button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-auto">
          <table className="w-full text-sm">
              <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id || t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{t.id || t._id}</td>
                    <td className="px-4 py-2">{t.quantity ?? t.qty ?? t.quantitySold}</td>
                    <td className="px-4 py-2">{t.type || t.txType || 'N/A'}</td>
                    <td className="px-4 py-2">{t.product?.name ?? t.productName ?? t.sku ?? 'N/A'}</td>
                    <td className="px-4 py-2">{t.vendor?.name ?? t.vendorName ?? t.supplierName ?? 'N/A'}</td>
                    <td className="px-4 py-2">{new Date(t.createdAt || t.date || t.timestamp || Date.now()).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/transactions/edit/${t.id || t._id}`)} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">Edit</button>
                        <button onClick={() => handleDelete(t.id || t._id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionOrderList;
