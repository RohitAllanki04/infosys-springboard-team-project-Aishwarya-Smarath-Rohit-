import React, { useEffect, useState } from "react";
import { getAllManagers, getAllUsers } from "../utils/api";
import { getProfile } from "../utils/auth";
import { isStoreManager, isAdmin } from "../utils/roles";

const Suppliers = () => {
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('managers'); // 'managers' or 'users'

  const profile = getProfile();
  const userRole = profile?.role;
  const canManage = isStoreManager(userRole) || isAdmin(userRole);

  useEffect(() => {
    fetchManagers();
    fetchUsers();
  }, []);

  const fetchManagers = () => {
    setError(null);
    setLoadingManagers(true);
    getAllManagers()
      .then(res => setManagers(res.data || []))
      .catch(err => {
        console.error('Failed to fetch managers', err);
        const status = err?.response?.status;
        const data = err?.response?.data || err.message;
        setError(`Managers fetch failed${status ? ` (status ${status})` : ''}: ${JSON.stringify(data)}`);
        setManagers([]);
      })
      .finally(() => setLoadingManagers(false));
  };

  const fetchUsers = () => {
    setError(null);
    setLoadingUsers(true);
    getAllUsers()
      .then(res => setUsers(res.data || []))
      .catch(err => {
        console.error('Failed to fetch users', err);
        const status = err?.response?.status;
        const data = err?.response?.data || err.message;
        setError(`Users fetch failed${status ? ` (status ${status})` : ''}: ${JSON.stringify(data)}`);
        setUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  };

  const getInitials = (name = '') => {
    return String(name).split(' ').map(n => n[0] || '').join('').slice(0,2).toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {view === 'managers' ? 'Store Managers' : 'Users'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {view === 'managers' 
              ? (isStoreManager(userRole) && !isAdmin(userRole) 
                  ? 'Manage your store manager team' 
                  : 'View all store managers in the system')
              : 'View all registered users'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('managers')}
            className={`px-4 py-2 rounded-lg font-medium transition shadow hover:shadow-md ${
              view === 'managers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👔 Store Managers
          </button>
          <button
            onClick={() => setView('users')}
            className={`px-4 py-2 rounded-lg font-medium transition shadow hover:shadow-md ${
              view === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👥 Users
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded">{error}</div>
      )}

      {/* Shared table layout for Managers and Users */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* loading / error / empty states */}
              { (view === 'managers' && loadingManagers) || (view === 'users' && loadingUsers) ? (
                <tr>
                  <td colSpan={7} className="px-4 py-2 text-center text-gray-600">Loading...</td>
                </tr>
              ) : (
                (() => {
                  const list = view === 'managers' ? managers : users;
                  if (!list || list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="px-4 py-2 text-center text-gray-500">No {view === 'managers' ? 'managers' : 'users'} found</td>
                      </tr>
                    );
                  }

                  return list.map((item) => (
                    <tr key={item.id ?? item.email ?? Math.random()} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">{getInitials(item.fullName ?? item.name)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{item.fullName ?? item.name}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.companyName ?? item.company ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.contactNumber ?? item.phone ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.warehouseLocation ?? item.warehouse ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{view === 'managers' ? 'Store Manager' : (item.role ?? item.roles?.map(r=>r.name).join(', ') ?? 'User')}</td>
                      <td className="px-4 py-2 text-right">
                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition">View</button>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
