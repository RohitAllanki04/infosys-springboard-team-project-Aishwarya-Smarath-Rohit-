import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  // Use env override to align with the main API base and leverage the Vite dev proxy for CORS-free calls.
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
  headers: {
    'X-API-KEY': 'MY_SECRET_123',
  },
});

// Add interceptor to include Authorization token in all requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[cartApiClient] Request with auth:', { 
      url: config.url, 
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
  } else {
    console.warn('[cartApiClient] No token found for request:', config.url);
  }
  return config;
}, (error) => Promise.reject(error));

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[cartApiClient] Error response:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    return Promise.reject(error);
  }
);

const unwrap = (response) => (response && response.data ? response.data : response);

// Feature flag: use backend cart endpoints when set to 'true'
const USE_BACKEND = String(import.meta.env.VITE_USE_BACKEND_CART || '').toLowerCase() === 'true';

// Local storage fallback (kept for offline/development)
const CART_STORAGE_KEY = 'smartshelfx_cart';

const getLocalCart = (userId) => {
  try {
    const allCarts = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '{}');
    return allCarts[userId] || [];
  } catch (e) {
    return [];
  }
};

const saveLocalCart = (userId, items) => {
  try {
    const allCarts = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '{}');
    allCarts[userId] = items;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(allCarts));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
};

export const listProducts = async () => {
  const res = await api.get('/api/products');
  return unwrap(res);
};

export const addToCart = async (userId, productId) => {
  if (!userId || !productId) throw new Error('userId and productId are required');

  if (USE_BACKEND) {
    const res = await api.post(`/cart/${encodeURIComponent(userId)}/add/${encodeURIComponent(productId)}`);
    return unwrap(res);
  }

  // local fallback
  const cart = getLocalCart(userId);
  const existingIndex = cart.findIndex(item => String(item.productId) === String(productId));
  if (existingIndex >= 0) {
    cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
  } else {
    cart.push({ productId, quantity: 1, addedAt: new Date().toISOString() });
  }
  saveLocalCart(userId, cart);
  return { success: true, items: cart };
};

export const increaseQty = async (userId, productId) => {
  if (!userId || !productId) throw new Error('userId and productId are required');

  if (USE_BACKEND) {
    const res = await api.post(`/cart/${encodeURIComponent(userId)}/increase/${encodeURIComponent(productId)}`);
    return unwrap(res);
  }

  const cart = getLocalCart(userId);
  const item = cart.find(i => String(i.productId) === String(productId));
  if (item) {
    item.quantity = (item.quantity || 1) + 1;
    saveLocalCart(userId, cart);
  }
  return { success: true, items: cart };
};

export const decreaseQty = async (userId, productId) => {
  if (!userId || !productId) throw new Error('userId and productId are required');

  if (USE_BACKEND) {
    const res = await api.post(`/cart/${encodeURIComponent(userId)}/decrease/${encodeURIComponent(productId)}`);
    return unwrap(res);
  }

  const cart = getLocalCart(userId);
  const item = cart.find(i => String(i.productId) === String(productId));
  if (item) {
    item.quantity = Math.max(0, (item.quantity || 1) - 1);
    if (item.quantity === 0) {
      const filtered = cart.filter(i => String(i.productId) !== String(productId));
      saveLocalCart(userId, filtered);
      return { success: true, items: filtered };
    }
    saveLocalCart(userId, cart);
  }
  return { success: true, items: cart };
};

export const removeFromCart = async (userId, productId) => {
  if (!userId || !productId) throw new Error('userId and productId are required');

  if (USE_BACKEND) {
    const res = await api.delete(`/cart/${encodeURIComponent(userId)}/remove/${encodeURIComponent(productId)}`);
    return unwrap(res);
  }

  const cart = getLocalCart(userId);
  const filtered = cart.filter(i => String(i.productId) !== String(productId));
  saveLocalCart(userId, filtered);
  return { success: true, items: filtered };
};

export const getCart = async (userId) => {
  if (!userId) throw new Error('userId is required');

  if (USE_BACKEND) {
    const res = await api.get(`/cart/${encodeURIComponent(userId)}/items`);
    return unwrap(res);
  }

  const cart = getLocalCart(userId);
  try {
    const products = await listProducts();
    const productsData = Array.isArray(products) ? products : products?.data || products?.items || [];
    const enrichedItems = cart.map(cartItem => {
      const product = productsData.find(p => String(p.id || p._id || p.productId) === String(cartItem.productId));
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity || 1,
        name: product?.name || 'Unknown Product',
        sku: product?.sku || cartItem.productId,
        price: product?.price || product?.unitPrice || 0,
        stock: product?.currentStock || product?.stock || 0,
        product: product
      };
    });
    return { items: enrichedItems };
  } catch (e) {
    console.error('Failed to enrich cart items', e);
    return { items: cart };
  }
};

export default api;
