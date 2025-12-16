import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentProfile, updateProfile } from '../utils/api'
import { getProfileFromToken } from '../utils/auth'

export default function ProfileEdit() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', contactNumber: '', warehouseLocation: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getCurrentProfile()
        if (data) {
          setForm({
            fullName: data.fullName || '',
            companyName: data.companyName || '',
            email: data.email || '',
            contactNumber: data.contactNumber || '',
            warehouseLocation: data.warehouseLocation || '',
          })
          setUserId(data.id || data.userId || data._id || null)
        } else {
          // fallback to token-derived
          const t = getProfileFromToken()
          if (t) {
            setForm({ fullName: t.fullName || '', companyName: t.companyName || '', email: t.email || '' })
            setUserId(t.id || t.sub || null)
          }
        }
      } catch (err) {
        setError(err?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!userId) throw new Error('No user id')
      await updateProfile(userId, form)
      navigate('/profile')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      {error && <div className="mb-3 p-2 text-red-800 bg-red-50 rounded">{String(error)}</div>}
      <form onSubmit={handleSave} className="space-y-3 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm">Full name</label>
          <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Company</label>
          <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Contact Number</label>
          <input value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Warehouse Location</label>
          <input value={form.warehouseLocation} onChange={e => setForm({...form, warehouseLocation: e.target.value})} className="w-full border p-2 rounded" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Save</button>
          <button type="button" onClick={() => navigate('/profile')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Cancel</button>
        </div>
      </form>
    </div>
  )
}
