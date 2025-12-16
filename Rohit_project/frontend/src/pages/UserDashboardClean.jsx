import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../utils/auth';
import { listProducts } from '../utils/cartApiClient';
import { useCart } from '../context/CartContext';

const normalizeProducts = (payload) => {
  const list = Array.isArray(payload) ? payload : payload?.data || payload?.items || [];
  const seen = new Set();
  const normalized = [];

  for (const p of list) {
    const backendId = p.id ?? p._id ?? p.productId ?? null;
    const sku = p.sku ?? p.code ?? backendId ?? p.name;
    const key = String(sku || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      id: key,
      backendId,
      sku,
      name: p.name ?? p.title ?? key,
      price: Number(p.price ?? p.unitPrice ?? p.cost ?? 0) || 0,
      stock: Number(p.currentStock ?? p.stock ?? p.quantity ?? 0) || 0,
    });
  }

  return normalized;
};

const UserDashboardClean = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);
  const { addItem, totalItems, totalPrice } = useCart();

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listProducts();
      setProducts(normalizeProducts(res));
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAdd = async (product) => {
    if ((product.stock ?? 0) <= 0) {
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Out of stock' } }));
      return;
    }
    try {
      setAddingId(product.backendId ?? product.id ?? product.sku);
      await addItem(product);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `${product.name} added to cart` } }));
    } catch (err) {
      console.error('Add to cart failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Could not add to cart' } }));
    } finally {
      setAddingId(null);
    }
  };

  const tableContent = useMemo(() => {
    if (loading) return <div className="p-4 text-center text-muted">Loading products...</div>;
    if (error) return <div className="alert alert-danger m-3 mb-0" role="alert">{error}</div>;
    if (!products.length) return <div className="p-4 text-center text-muted">No products found.</div>;

    return (
      <div className="table-responsive">
        <table className="table mb-0 align-middle">
          <thead className="table-light text-uppercase small">
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Name</th>
              <th scope="col">Stock</th>
              <th scope="col">Price</th>
              <th scope="col" className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const outOfStock = (product.stock ?? 0) <= 0;
              const busy = addingId === (product.backendId ?? product.id ?? product.sku);
              return (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>
                    {outOfStock ? (
                      <span className="badge bg-danger-subtle text-danger">Out of stock</span>
                    ) : (
                      <span className="badge bg-success-subtle text-success">{product.stock} available</span>
                    )}
                  </td>
                  <td>${(product.price || 0).toFixed(2)}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAdd(product)}
                      disabled={outOfStock || busy}
                    >
                      {busy ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [products, loading, error, addingId]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1">Welcome, {profile?.fullName || profile?.username || 'User'}</h1>
          <p className="text-muted mb-0">Browse products and add them to your cart.</p>
        </div>
        <div className="text-md-end">
          <div className="fw-semibold">Items in cart: {totalItems}</div>
          <div className="text-muted small">Total price: ${totalPrice.toFixed(2)}</div>
          <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => navigate('/cart')} disabled={totalItems === 0}>
            Open Cart
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Product Catalog</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchProducts} disabled={loading}>
                Refresh
              </button>
            </div>
            <div className="card-body p-0">
              {tableContent}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header fw-semibold">Cart Summary</div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Total items</span>
                <span className="fw-bold">{totalItems}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Total price</span>
                <span className="fw-bold">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={() => navigate('/cart')}
                disabled={totalItems === 0}
              >
                Go to Cart
              </button>
              <div className="text-muted small mt-3">
                Add items from the catalog to start a purchase.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardClean;
