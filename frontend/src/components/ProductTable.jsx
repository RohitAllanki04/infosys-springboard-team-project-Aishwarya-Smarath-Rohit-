import React, { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../utils/api";
import { addToCart } from '../utils/cart'
import ProductForm from './ProductForm'
import { getToken, getProfile, getProfileFromToken } from '../utils/auth'
import { isStoreManager } from '../utils/roles'

const ProductTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState(null);

  // determine role and permissions
  const token = getToken()
  const storedProfile = getProfile()
  const role = storedProfile && storedProfile.role ? storedProfile.role : (token ? (getProfileFromToken(token) || {}).role : null)
  const canEdit = isStoreManager(role)

  const refresh = () => {
    setLoading(true)
    setError(null)
    return getProducts()
      .then(res => {
        const payload = res && res.data ? res.data : null
        let list = []
        if (Array.isArray(payload)) list = payload
        else if (Array.isArray(payload?.data)) list = payload.data
        else if (Array.isArray(payload?.products)) list = payload.products
        else list = []
        setProducts(list)
        return list
      })
      .catch(err => {
        console.error('getProducts failed', err)
        setProducts([])
        // axios error handling: prefer status + message or response body
        let message = 'Failed to load products'
        if (err.response) {
          try {
            const body = err.response.data
            message = `HTTP ${err.response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`
          } catch (e) {
            message = `HTTP ${err.response.status}`
          }
        } else if (err.request) {
          message = 'No response from server (network/CORS?)'
        } else if (err.message) {
          message = err.message
        }
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, []);

  // Lock body scroll while modal open & close on Escape
  useEffect(() => {
    if (!showForm) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false)
        setEditingProductId(null)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [showForm])

  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">Products</h2>

      <div className="flex justify-between items-center mb-4">
        <div />
        <div>
          {canEdit && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition" onClick={() => { setEditingProductId(null); setShowForm(true); }}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Inline product form: visible between navbar and table for users with edit permissions */}
      {showForm && canEdit && (
        <div className="mb-4">
          <ProductForm
            productId={editingProductId}
            onDone={() => { setShowForm(false); setEditingProductId(null); refresh(); }}
            onCancel={() => { setShowForm(false); setEditingProductId(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <>
          {error ? (
            <div className="text-red-600 py-6">Error loading products: {error}</div>
          ) : products.length === 0 ? (
            <div className="text-gray-600 py-6">No products available.</div>
          ) : (
            <table className="min-w-full border border-gray-200 rounded-xl">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Reorder Level</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id ?? p.sku ?? JSON.stringify(p)} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2">{p.id ?? '-'}</td>
                      <td className="px-4 py-2">{p.name ?? p.title ?? '-'}</td>
                      <td className="px-4 py-2">{p.category ?? '-'}</td>
                      <td className={`px-4 py-2 ${(typeof p.currentStock === 'number' && typeof p.reorderLevel === 'number' && p.currentStock < p.reorderLevel) ? "text-red-600 font-bold" : "text-gray-800"}`}>
                        {typeof p.currentStock === 'number' ? p.currentStock : '-'}
                      </td>
                      <td className="px-4 py-2">{typeof p.reorderLevel === 'number' ? p.reorderLevel : '-'}</td>
                      <td className="px-4 py-2">{p.sku ?? '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                          onClick={() => {
                            try {
                              addToCart(p, 1)
                              window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Added to cart' } }))
                            } catch (err) {
                              console.error('addToCart failed', err)
                              window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to add to cart' } }))
                            }
                          }}
                        >
                          Add to cart
                        </button>
                        <button
                          className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Bought product: ${p.name ?? p.title ?? 'item'}` } }))
                          }}
                        >
                          Buy now
                        </button>
                        {canEdit && (
                          <>
                            <button
                              className="px-4 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition"
                              onClick={() => { setEditingProductId(p.id ?? p._id); setShowForm(true); }}
                            >
                              Edit
                            </button>

                            <button
                              className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                              onClick={async () => {
                                try {
                                  const ok = await (window.showConfirm ? window.showConfirm('Delete this product?') : Promise.resolve(window.confirm('Delete this product?')))
                                  if (!ok) return
                                  await deleteProduct(p.id)
                                  window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Product deleted' } }));
                                  refresh()
                                } catch (err) {
                                  console.error(err)
                                  window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to delete' } }));
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {/* Inline form rendered above - modal removed in favor of inline editing */}
    </div>
  );
};

export default ProductTable;
