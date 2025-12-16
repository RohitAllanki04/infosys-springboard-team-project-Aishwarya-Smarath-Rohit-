import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProfile } from '../utils/auth';
import { createPurchaseFlat, API_BASE_URL } from '../utils/api';
import { getToken, getProfileFromToken } from '../utils/auth';

const Cart = () => {
  const navigate = useNavigate();
  const { items, loading, totalItems, totalPrice, refreshCart, increaseItem, decreaseItem, removeItem } = useCart();
  const [busyId, setBusyId] = useState(null);
  const profile = getProfile();
  const useBackend = String(import.meta.env.VITE_USE_BACKEND_CART || '').toLowerCase() === 'true';
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleIncrease = async (productId) => {
    try {
      setBusyId(productId);
      await increaseItem(productId);
    } catch (err) {
      console.error('Increase failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Could not increase quantity' } }));
    } finally {
      setBusyId(null);
    }
  };

  const handleDecrease = async (productId) => {
    try {
      setBusyId(productId);
      await decreaseItem(productId);
    } catch (err) {
      console.error('Decrease failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Could not decrease quantity' } }));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setBusyId(productId);
      await removeItem(productId);
    } catch (err) {
      console.error('Remove failed', err);
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Could not remove item' } }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Your Cart</h1>
          <p className="text-muted mb-0">Signed in as {profile?.fullName || profile?.username || 'User'}</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/userdashboard')}>
          Continue Shopping
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Items</span>
              <span className="badge bg-primary-subtle text-primary">{totalItems} total</span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">Loading cart...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-muted">Your cart is empty.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light text-uppercase small">
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col" className="text-center" style={{ width: '160px' }}>Quantity</th>
                        <th scope="col" className="text-end">Price</th>
                        <th scope="col" className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const disabled = busyId === it.id || loading;
                        return (
                          <tr key={it.id}>
                            <td>
                              <div className="fw-semibold">{it.name}</div>
                              <div className="text-muted small">SKU: {it.sku || 'N/A'}</div>
                            </td>
                            <td className="text-center">
                              <div className="btn-group" role="group" aria-label="quantity controls">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleDecrease(it.id)}
                                  disabled={disabled}
                                >
                                  −
                                </button>
                                <span className="btn btn-light btn-sm disabled">{it.qty}</span>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleIncrease(it.id)}
                                  disabled={disabled}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="text-end fw-semibold">${(it.price * it.qty).toFixed(2)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-link text-danger px-0"
                                onClick={() => handleRemove(it.id)}
                                disabled={disabled}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header fw-semibold">Summary</div>
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
                disabled={items.length === 0 || loading || processing}
                onClick={async () => {
                  if (items.length === 0) return;

                  // Immediate auth/role check and notification
                  const token = getToken();
                  if (!token) {
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Please sign in to complete purchase' } }));
                    return;
                  }

                  try {
                    const decoded = getProfileFromToken(token) || {};
                    const role = (decoded && decoded.role) ? String(decoded.role).toLowerCase() : String(profile?.role || '').toLowerCase();
                    const allowed = role.includes('admin') || role.includes('vendor') || role.includes('storemanager') || role.includes('store_manager') || role.includes('store-manager');
                    if (!allowed) {
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'You do not have permission to create purchases. Contact your administrator.' } }));
                      return;
                    }
                  } catch (e) {
                    console.warn('Role check failed', e);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'You do not have permission to create purchases. Contact your administrator.' } }));
                    return;
                  }

                  try {
                    setProcessing(true);

                    // Determine vendor id from profile (for vendor/store manager users)
                    const vendorId = profile && (profile.id || profile.userId || profile._id);
                    if (!vendorId) {
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Vendor id not found in your profile' } }));
                      setProcessing(false);
                      return;
                    }

                    // Create purchases sequentially to allow stock adjustments and predictable errors
                    for (const it of items) {
                      const productId = it.id || it.productId || it.sku;
                      const qty = Number(it.qty || it.quantity || 1);
                      if (!productId) continue;

                      const purchasePayload = {
                        quantity: qty,
                        status: 'PENDING',
                        product: { id: Number(productId) || productId },
                        vendor: { id: Number(vendorId) || vendorId },
                      };

                      try {
                        console.debug('[Cart] createPurchase payload', purchasePayload);
                        await createPurchaseFlat(purchasePayload);
                      } catch (err) {
                        console.error('Create purchase failed for product', productId, err);
                        // Show backend error message if provided
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Failed to create purchase' } }));
                        // Stop processing further items
                        setProcessing(false);
                        return;
                      }
                    }

                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase(s) created successfully' } }));

                    // If frontend is using local cart, clear it for this user
                    if (!useBackend && vendorId) {
                      try {
                        const raw = JSON.parse(localStorage.getItem('smartshelfx_cart') || '{}');
                        delete raw[vendorId];
                        localStorage.setItem('smartshelfx_cart', JSON.stringify(raw));
                      } catch (e) {
                        console.error('Failed clearing local cart after purchase', e);
                      }
                    }

                    // Refresh cart from context and navigate to purchases list
                    await refreshCart();
                    navigate('/purchases');
                  } catch (err) {
                    console.error('Create purchase failed', err);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: err.message || 'Could not create purchase' } }));
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                {processing ? 'Processing…' : 'Proceed to Checkout'}
              </button>
              <div className="text-muted small mt-3">
                Adjust quantities or remove items. Updates are saved immediately.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
