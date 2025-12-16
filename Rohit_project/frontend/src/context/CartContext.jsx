import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile } from '../utils/auth';
import {
  addToCart as apiAddToCart,
  increaseQty as apiIncreaseQty,
  decreaseQty as apiDecreaseQty,
  removeFromCart as apiRemoveFromCart,
  getCart as apiGetCart,
  listProducts as apiListProducts,
} from '../utils/cartApiClient';

const CartContext = createContext(undefined);

const normalizeItems = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.items || payload?.data || [];
  return (list || []).map((i) => ({
    id: i.productId ?? i.product?.id ?? i.id ?? i._id ?? i.sku,
    name: i.name ?? i.product?.name ?? 'Item',
    sku: i.sku ?? i.product?.sku ?? '',
    price: Number(i.unitPrice ?? i.price ?? i.product?.price ?? 0) || 0,
    qty: Number(i.quantity ?? i.qty ?? i.count ?? 1) || 1,
    stock: typeof i.stock !== 'undefined' ? Number(i.stock) : Number(i.product?.stock ?? i.product?.quantity ?? 0) || undefined,
  }));
};

const resolveUserId = () => {
  const profile = getProfile();
  const userId = profile && (profile.id || profile.userId || profile._id);
  console.log('[CartContext] Resolved userId:', { profile, userId });
  return userId;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    const uid = resolveUserId();
    if (!uid) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiGetCart(uid);
      setItems(normalizeItems(res));
    } catch (err) {
      console.error('Failed to load cart', err);
      // If backend mode is enabled but call failed, try falling back to localStorage cart
      try {
        const useBackend = String(import.meta.env.VITE_USE_BACKEND_CART || '').toLowerCase() === 'true';
        if (useBackend) {
          const raw = JSON.parse(localStorage.getItem('smartshelfx_cart') || '{}');
          const localCart = raw[uid] || [];
          // Enrich local cart with product details
          const productsRes = await apiListProducts();
          const productsData = Array.isArray(productsRes) ? productsRes : productsRes?.data || productsRes?.items || [];
          const enriched = localCart.map(ci => {
            const p = productsData.find(pr => String(pr.id || pr._id || pr.productId) === String(ci.productId));
            return {
              productId: ci.productId,
              quantity: ci.quantity || 1,
              name: p?.name || 'Unknown Product',
              sku: p?.sku || ci.productId,
              price: p?.price || p?.unitPrice || 0,
              stock: p?.currentStock || p?.stock || 0,
              product: p,
            };
          });
          setItems(normalizeItems({ items: enriched }));
          return;
        }
      } catch (e) {
        console.error('Local fallback failed', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (product) => {
    const uid = resolveUserId();
    if (!uid) throw new Error('Please sign in to add items');
    const productId = product?.backendId ?? product?.id ?? product?.productId ?? product?._id ?? product?.sku;
    if (!productId) throw new Error('Missing product id');
    if (typeof product?.stock !== 'undefined' && Number(product.stock) <= 0) throw new Error('Out of stock');
    console.log('[CartContext] Adding to cart:', { userId: uid, productId, product });
    await apiAddToCart(uid, productId);
    await refreshCart();
  }, [refreshCart]);

  const increaseItem = useCallback(async (productId) => {
    const uid = resolveUserId();
    if (!uid || !productId) return;
    await apiIncreaseQty(uid, productId);
    await refreshCart();
  }, [refreshCart]);

  const decreaseItem = useCallback(async (productId) => {
    const uid = resolveUserId();
    if (!uid || !productId) return;
    await apiDecreaseQty(uid, productId);
    await refreshCart();
  }, [refreshCart]);

  const removeItem = useCallback(async (productId) => {
    const uid = resolveUserId();
    if (!uid || !productId) return;
    await apiRemoveFromCart(uid, productId);
    await refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const totalItems = useMemo(() => items.reduce((sum, it) => sum + (it.qty || 0), 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0), [items]);

  const value = useMemo(() => ({
    items,
    loading,
    totalItems,
    totalPrice,
    refreshCart,
    addItem,
    increaseItem,
    decreaseItem,
    removeItem,
  }), [items, loading, totalItems, totalPrice, refreshCart, addItem, increaseItem, decreaseItem, removeItem]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
