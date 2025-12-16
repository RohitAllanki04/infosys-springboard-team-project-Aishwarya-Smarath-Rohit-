import axios from 'axios';
import { API_BASE_URL } from './api';
import { getToken } from './auth';

const getConfig = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers };
};

export const getAllTransactions = () => axios.get(`${API_BASE_URL}/api/stock-transactions`, getConfig());
export const getTransactionById = (id) => axios.get(`${API_BASE_URL}/api/stock-transactions/${encodeURIComponent(id)}`, getConfig());
export const getTransactionsByVendorId = (vendorId) => axios.get(`${API_BASE_URL}/api/stock-transactions/vendor/${encodeURIComponent(vendorId)}`, getConfig());
export const createTransaction = (data) => axios.post(`${API_BASE_URL}/api/stock-transactions`, data, getConfig());
export const updateTransaction = (id, data) => axios.put(`${API_BASE_URL}/api/stock-transactions/${encodeURIComponent(id)}`, data, getConfig());
export const deleteTransaction = (id) => axios.delete(`${API_BASE_URL}/api/stock-transactions/${encodeURIComponent(id)}`, getConfig());

export default {
  getAllTransactions,
  getTransactionById,
  getTransactionsByVendorId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
