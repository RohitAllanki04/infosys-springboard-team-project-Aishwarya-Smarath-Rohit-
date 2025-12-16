import React, { useState, useEffect } from 'react'
import { createProduct } from '../utils/api'
import { decodeToken } from '../utils/auth'

// Minimal ProductForm: posts to /api/products with fields
// { name, sku, reorderLevel, currentStock, category }
export default function ProductForm({ onDone }) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [category, setCategory] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successId, setSuccessId] = useState(null)
  const [vendorId, setVendorId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const parts = token.split('.')
      if (parts.length < 2) return
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const id = payload.id ?? payload.sub ?? payload.userId ?? payload._id ?? null
      setVendorId(id)
    } catch (err) {
      console.warn('Failed to decode token payload', err)
    }
  }, [])

  function buildPayload() {
    return {
      name: String(name || '').trim(),
      sku: String(sku || '').trim(),
      reorderLevel: reorderLevel === '' ? 0 : Number(reorderLevel),
      currentStock: currentStock === '' ? 0 : Number(currentStock),
      category: String(category || '').trim(),
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccessId(null)
    setLoading(true)
    try {
      // Basic client-side guard: ensure we found a vendor id from token
      const token = localStorage.getItem('token')
      if (!token || !vendorId) {
        // try decode to give better message
        const decoded = decodeToken(token)
        if (!decoded) {
          setError('Not authenticated: no valid token found. Please sign in.');
        } else if (decoded.exp && Date.now() / 1000 > decoded.exp) {
          setError('Session expired: please sign in again.');
        } else {
          setError('Missing vendor id in token payload; cannot create product.');
        }
        setLoading(false)
        return
      }

      const payload = buildPayload()
      const res = await createProduct(payload)
      const data = res?.data ?? null
      const createdId = (data && (data.id ?? data._id ?? data.productId)) || null
      setSuccessId(createdId)
        setName('')
        setSku('')
        setReorderLevel('')
        setCurrentStock('')
        setCategory('')
        if (onDone) onDone(data)
    } catch (err) {
      // axios error objects have response.data or message
      const msg = err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? String(err)
      setError(msg)
      }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-md">
      <h3 className="text-lg font-bold mb-3">Add Product</h3>
      {successId && <div className="mb-3 p-2 text-green-800 bg-green-50 rounded">Created product id: {String(successId)}</div>}
      {error && <div className="mb-3 p-2 text-red-800 bg-red-50 rounded">Error: {String(error)}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input name="name" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">SKU</label>
          <input name="sku" value={sku} onChange={e => setSku(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Current Stock</label>
            <input name="currentStock" type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Reorder Level</label>
            <input name="reorderLevel" type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <input name="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">Vendor id (from token): {vendorId ?? 'not found'}</div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60 hover:bg-blue-700 transition">{loading ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}
