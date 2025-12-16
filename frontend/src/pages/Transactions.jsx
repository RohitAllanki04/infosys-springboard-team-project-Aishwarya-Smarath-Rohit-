import React, { useEffect, useState } from "react";
import { getTransactions } from "../utils/api";
import TransactionTable from "../components/TransactionsTable";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState('IN'); // IN or OUT
  const [formData, setFormData] = useState({
    productSku: '',
    quantity: '',
    handler: '',
    notes: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    getTransactions()
      .then(res => setTransactions(res.data))
      .catch(err => console.error("Failed to fetch transactions", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call API to create transaction
      const payload = {
        ...formData,
        type: transactionType,
        timestamp: new Date().toISOString()
      };
      
      // await createTransaction(payload); // Implement this in api.js
      
      window.dispatchEvent(new CustomEvent('notify', { 
        detail: { type: 'success', message: `${transactionType === 'IN' ? 'Stock-In' : 'Stock-Out'} recorded successfully` } 
      }));
      
      setShowForm(false);
      setFormData({ productSku: '', quantity: '', handler: '', notes: '' });
      fetchTransactions();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('notify', { 
        detail: { type: 'error', message: 'Failed to record transaction' } 
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Stock Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Record Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Record Stock Transaction</h2>
          
          <div className="mb-4 flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="IN"
                checked={transactionType === 'IN'}
                onChange={(e) => setTransactionType(e.target.value)}
                className="mr-2"
              />
              <span className="text-green-600 font-medium">Stock-In (Incoming)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="OUT"
                checked={transactionType === 'OUT'}
                onChange={(e) => setTransactionType(e.target.value)}
                className="mr-2"
              />
              <span className="text-red-600 font-medium">Stock-Out (Outgoing)</span>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product SKU</label>
              <input
                type="text"
                value={formData.productSku}
                onChange={(e) => setFormData({...formData, productSku: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg hover:border-gray-400 focus:border-blue-500 transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg hover:border-gray-400 focus:border-blue-500 transition"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Handler Name</label>
              <input
                type="text"
                value={formData.handler}
                onChange={(e) => setFormData({...formData, handler: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg hover:border-gray-400 focus:border-blue-500 transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg hover:border-gray-400 focus:border-blue-500 transition"
              />
            </div>
            
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Record Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      <TransactionTable transactions={transactions} />
    </div>
  );
};

export default Transactions;

