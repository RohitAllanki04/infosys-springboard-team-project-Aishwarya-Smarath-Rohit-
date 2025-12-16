import React, { useEffect, useState } from 'react'
import { getAllProfiles, updateProfile, deleteProfile } from '../utils/api'

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await getAllProfiles()
      setProfiles(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(p) {
    setEditingId(p.id)
    setEditForm({
      fullName: p.fullName || '',
      companyName: p.companyName || '',
      email: p.email || '',
      contactNumber: p.contactNumber || '',
      warehouseLocation: p.warehouseLocation || '',
      role: p.role || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit() {
    setError(null)
    setLoading(true)
    try {
      await updateProfile(editingId, editForm)
      await load()
      cancelEdit()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this profile?')) return
    setError(null)
    setLoading(true)
    try {
      await deleteProfile(id)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading profiles...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Profiles</h1>
      {error && <div className="mb-3 p-2 text-red-800 bg-red-50 rounded">{String(error)}</div>}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Full name</th>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.id}</td>
                <td className="p-2">
                  {editingId === p.id ? (
                    <input className="border p-1" value={editForm.fullName} onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))} />
                  ) : (p.fullName)}
                </td>
                <td className="p-2">{editingId === p.id ? (
                  <input className="border p-1" value={editForm.companyName} onChange={e => setEditForm(prev => ({ ...prev, companyName: e.target.value }))} />
                ) : p.companyName}</td>
                <td className="p-2">{editingId === p.id ? (
                  <input className="border p-1" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
                ) : p.email}</td>
                <td className="p-2">{editingId === p.id ? (
                  <select className="border p-1" value={editForm.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="STORE_MANAGER">STORE_MANAGER</option>
                    <option value="USER">USER</option>
                  </select>
                ) : p.role}</td>
                <td className="p-2">
                  {editingId === p.id ? (
                    <>
                      <button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded mr-2">Save</button>
                      <button onClick={cancelEdit} className="px-2 py-1 bg-gray-200 rounded">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)} className="px-2 py-1 bg-blue-600 text-white rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
