import axios from "axios";
import { getToken, getProfileFromToken } from "./auth";

// Prefer same-origin calls during development via Vite proxy; fallback to localhost:8081 when no env override is set.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// Helper to build axios/fetch config with Authorization header when token exists
const getConfig = () => {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers };
};

// Ensure axios always sends Authorization header when available
axios.interceptors.request.use((config) => {
  try {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
      // Temporary debug: log requests to profile endpoints and whether Authorization is present
      try {
        const u = config.url || config.baseURL || '';
        // Log purchases requests for debugging auth/permission issues
        if (u.includes('/api/profiles') || u.includes('/api/purchases')) {
          const masked = token.length > 10 ? `${token.slice(0,6)}...${token.slice(-6)}` : token;
          console.debug('[api-debug] request', { url: u, method: config.method, authPresent: !!config.headers.Authorization, tokenMasked: masked, headers: config.headers });
        }
      } catch (e) {
        // ignore debug errors
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => Promise.reject(error));

axios.interceptors.response.use((response) => response, (error) => {
  try {
    const reqUrl = error?.config?.url || error?.request?.responseURL || '';
    if (reqUrl && reqUrl.includes('/api/purchases')) {
      console.error('[api-debug] purchases error', {
        url: reqUrl,
        status: error?.response?.status,
        responseData: error?.response?.data,
        requestHeaders: error?.config?.headers,
      });
    }
  } catch (e) {
    // ignore
  }
  return Promise.reject(error);
});

// Helper for fetch-based calls that need Authorization header
export const authFetch = async (input, init = {}) => {
  const token = getToken();
  const headers = Object.assign({}, init.headers || {});
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = String(input).startsWith('http') ? input : `${API_BASE_URL}${input}`;
  return fetch(url, { ...init, headers });
}

// Signup (no JWT required)
export const signup = async (data) => {
  const url = `${API_BASE_URL}/api/auth/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    // try to parse JSON error, fallback to text
    try {
      const body = await res.json();
      const msg = body?.message || JSON.stringify(body) || res.statusText;
      throw new Error(msg);
    } catch (e) {
      const txt = await res.text();
      throw new Error(txt || `Signup failed with status ${res.status}`);
    }
  }

  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

// ------------------- Public API -------------------
// Signup (no JWT required)
export const createProduct = (product) => {
  // Send only the Product fields in the request body and rely on the server
  // to extract the authenticated user id from the Authorization header.
  const payload = {
    name: product.name ?? '',
    sku: product.sku ?? '',
    reorderLevel: (typeof product.reorderLevel !== 'undefined' && product.reorderLevel !== null) ? product.reorderLevel : (Number(product.reorderLevel) || 0),
    currentStock: (typeof product.currentStock !== 'undefined' && product.currentStock !== null) ? product.currentStock : (Number(product.currentStock) || 0),
    category: product.category ?? '',
  }

  console.debug('createProduct payload (no vendor_id):', payload, 'headers=', getConfig().headers);
  return axios.post(`${API_BASE_URL}/api/products/add`, payload, getConfig()).catch(err => {
    if (err?.response?.status === 403) {
      console.warn('[api] createProduct received 403 Forbidden', { url: `${API_BASE_URL}/api/products/add`, payload, headers: getConfig().headers, response: err.response.data });
      const msg = err.response.data?.message || 'Forbidden: you do not have permission to create products';
      const e = new Error(msg);
      e.response = err.response;
      throw e;
    }
    throw err;
  });
};
export const getProducts = (params) => {
  // Some backends expect different query param names for vendor scoping.
  // If a vendor id is provided, include several common param names so the
  // server can pick the one it recognizes: `vendor_id`, `vendorId`, `vendor`.
  let effectiveParams = params || undefined;
  if (params && (params.vendor_id || params.vendorId || params.vendor)) {
    const id = params.vendor_id || params.vendorId || params.vendor;
    effectiveParams = { ...params, vendor_id: id, vendorId: id, vendor: id };
  }
  return axios.get(`${API_BASE_URL}/api/products`, { ...getConfig(), params: effectiveParams });
};

// Convenience: fetch products scoped to the current user/vendor based on JWT
export const getProductsForCurrentUser = () => {
  try {
    const token = getToken();
    const profile = getProfileFromToken(token);
    const vendor_id = profile && (profile.id || profile.userId || profile._id);
    if (!vendor_id) return Promise.reject(new Error('No vendor id found in token'));
    return getProducts({ vendor_id });
  } catch (err) {
    return Promise.reject(err);
  }
};

// Backend may expose an endpoint to list products by vendor id, e.g.:
// GET /api/products/vendor/{vendorId}
export const getProductsByVendor = (vendorId) => {
  if (!vendorId) return Promise.reject(new Error('Vendor id required'));
  // ensure numeric id when possible (backend sample used Long)
  const id = (typeof vendorId === 'string' && /^\d+$/.test(vendorId)) ? Number(vendorId) : vendorId;
  return axios.get(`${API_BASE_URL}/api/products/vendor/${encodeURIComponent(id)}`, getConfig());
};

// Transactions
export const getTransactions = () => axios.get(`${API_BASE_URL}/api/transactions`, getConfig());

// Purchase Orders (server-side model: Purchase / /api/purchases)
export const getRestockOrders = (params) => axios.get(`${API_BASE_URL}/api/purchases`, { ...getConfig(), params });

// Approve / Reject purchase orders
export const approveRestockOrder = (id) => {
  if (!id) return Promise.reject(new Error('Order id required'));
  return axios.post(`${API_BASE_URL}/api/purchases/${encodeURIComponent(id)}/approve`, {}, getConfig());
}

export const rejectRestockOrder = (id, reason) => {
  if (!id) return Promise.reject(new Error('Order id required'));
  const payload = reason ? { reason } : {};
  return axios.post(`${API_BASE_URL}/api/purchases/${encodeURIComponent(id)}/reject`, payload, getConfig());
}

// New public aliases using "purchase" naming to match backend model
export const getPurchases = (params) => getRestockOrders(params);
export const approvePurchaseOrder = (id) => approveRestockOrder(id);
export const rejectPurchaseOrder = (id, reason) => rejectRestockOrder(id, reason);

// Create, read, update individual purchase orders
export const createPurchase = (purchase) => axios.post(`${API_BASE_URL}/api/purchases`, purchase, getConfig());

export const getPurchaseById = (id) => {
  if (!id) return Promise.reject(new Error('Purchase id required'));
  return axios.get(`${API_BASE_URL}/api/purchases/${encodeURIComponent(id)}`, getConfig());
}

export const updatePurchase = (id, purchase) => {
  if (!id) return Promise.reject(new Error('Purchase id required'));
  return axios.put(`${API_BASE_URL}/api/purchases/${encodeURIComponent(id)}`, purchase, getConfig());
}

// Normalize purchase payloads to a flattened shape expected by some backends
function normalizePurchasePayload(purchase) {
  if (!purchase || typeof purchase !== 'object') return purchase;
  const out = { ...purchase };

  // If nested product/vendor objects are present, prefer their id fields
  const prod = purchase.product || purchase.productId || purchase.product_id || null;
  if (prod) {
    out.productId = typeof prod === 'object' ? (prod.id ?? prod._id ?? prod.productId) : prod;
    delete out.product;
  }

  const vend = purchase.vendor || purchase.vendorId || purchase.vendor_id || null;
  if (vend) {
    out.vendorId = typeof vend === 'object' ? (vend.id ?? vend._id ?? vend.vendorId) : vend;
    delete out.vendor;
  }

  // Some backends expect quantity and status fields; keep them as-is
  return out;
}

// Override create/update helpers to accept nested or flat payloads and send a flattened body
export const createPurchaseFlat = async (purchase) => {
  const payload = normalizePurchasePayload(purchase);
  try {
    const res = await axios.post(`${API_BASE_URL}/api/purchases`, payload, getConfig());
    // Send email notification to the purchase creator and all managers (best-effort, async)
    (async () => {
      try {
        const token = getToken();
        const profile = getProfileFromToken(token);
        const userEmail = profile?.email || profile?.sub || null;

        // Try to fetch manager emails from backend; fall back to empty list
        let managerEmails = [];
        try {
          const mgrRes = await axios.get(`${API_BASE_URL}/api/profiles/Manager`, getConfig());
          if (Array.isArray(mgrRes?.data)) {
            managerEmails = mgrRes.data.map(m => m.email).filter(Boolean);
          }
        } catch (e) {
          // ignore manager fetch errors
          console.debug('[notify] could not fetch managers', e?.message || e);
        }

        const recipients = [];
        if (userEmail) recipients.push(userEmail);
        recipients.push(...managerEmails);
        if (recipients.length === 0) return;

        const subject = `Purchase created: ${res?.data?.id ?? ''}`;
        const message = `A new purchase/order was created with id ${res?.data?.id ?? ''} for product ${payload.productId ?? payload.product?.id ?? ''} (qty: ${payload.quantity ?? ''}).`;

        // Best-effort send, try multiple endpoints if backend exposes different paths
        const notifyPayload = { to: recipients, subject, message, metadata: { purchase: res?.data } };
        try {
          await axios.post(`${API_BASE_URL}/api/notifications/email`, notifyPayload, getConfig());
        } catch (e) {
          try {
            await axios.post(`${API_BASE_URL}/api/notifications/send`, notifyPayload, getConfig());
          } catch (e2) {
            console.debug('[notify] send attempts failed', e2?.message || e2);
          }
        }
      } catch (err) {
        console.debug('[notify] unexpected error', err?.message || err);
      }
    })();
    return res.data;
  } catch (err) {
    // Provide clearer error message for 403
    if (err?.response?.status === 403) {
      const message = err.response.data?.message || 'Forbidden: you do not have permission to create purchases';
      const e = new Error(message);
      e.response = err.response;
      throw e;
    }
    throw err;
  }
}

export const updatePurchaseFlat = (id, purchase) => {
  if (!id) return Promise.reject(new Error('Purchase id required'));
  const payload = normalizePurchasePayload(purchase);
  return axios.put(`${API_BASE_URL}/api/purchases/${encodeURIComponent(id)}`, payload, getConfig());
}

// Suppliers
export const getSuppliers = () => axios.get(`${API_BASE_URL}/api/suppliers`, getConfig());
export const createSupplier = (supplier) => axios.post(`${API_BASE_URL}/api/suppliers`, supplier, getConfig());
export const updateSupplier = (id, supplier) => axios.put(`${API_BASE_URL}/api/suppliers/${encodeURIComponent(id)}`, supplier, getConfig());

// Users
export const getUserById = (id) => {
  // If caller didn't provide an id, try to extract it from the JWT payload.
  let resolvedId = id;
  if (!resolvedId) {
    try {
      const profile = getProfileFromToken();
      resolvedId = profile && (profile.id || profile.sub || profile.userId || profile._id);
    } catch (e) {
      // ignore
    }
  }

  if (!resolvedId) return Promise.reject(new Error('User id required'));

  // Try common backend patterns for user/profile endpoints. Some backends expose
  // /api/profiles/:id while others use /api/users/:id. Try profiles first, then users.
  const urlProfiles = `${API_BASE_URL}/api/profiles/${encodeURIComponent(resolvedId)}`;
  const urlUsers = `${API_BASE_URL}/api/users/${encodeURIComponent(resolvedId)}`;

  return axios.get(urlProfiles, getConfig()).catch(() => axios.get(urlUsers, getConfig()));
}

// Profiles admin APIs
export const getAllProfiles = () => axios.get(`${API_BASE_URL}/api/profiles`, getConfig());

// List users by role (backend endpoints added: /api/profiles/users, /api/profiles/managers)
export const getAllUsers = () => axios.get(`${API_BASE_URL}/api/profiles/User`, getConfig());
export const getAllManagers = () => axios.get(`${API_BASE_URL}/api/profiles/Manager`, getConfig());

export const updateProfile = (id, profile) => {
  if (!id) return Promise.reject(new Error('Profile id required'));
  return axios.put(`${API_BASE_URL}/api/profiles/${encodeURIComponent(id)}`, profile, getConfig());
}

export const deleteProfile = (id) => {
  if (!id) return Promise.reject(new Error('Profile id required'));
  return axios.delete(`${API_BASE_URL}/api/profiles/${encodeURIComponent(id)}`, getConfig());
}

// Convenience: delete currently authenticated user's profile/account
export const deleteCurrentProfile = async () => {
  const token = getToken();
  const profile = getProfileFromToken(token);
  const id = profile && (profile.id || profile.sub || profile.userId || profile._id);
  if (!id) return Promise.reject(new Error('No user id found in token'));
  try {
    const res = await deleteProfile(id);
    // normalize result message
    const message = res?.data?.message || `Profile ${id} deleted`;
    return { success: true, message };
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Delete failed';
    throw new Error(message);
  }
}

// Fetch profile for the currently authenticated user.
// Tries common endpoints in order: /api/profiles/me -> /api/users/me -> /api/profiles/:id -> /api/users/:id
export const getCurrentProfile = () => {
  try {
    const token = getToken();
    if (!token) return Promise.reject(new Error('No token found'));

    // Try a /me endpoint first (some backends expose this)
    const tryMe = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/profiles/me`, getConfig())
        return res.data
      } catch (e) {
        const r = await axios.get(`${API_BASE_URL}/api/users/me`, getConfig())
        return r.data
      }
    }

    return tryMe().catch(async () => {
      // Fallback: extract id from token and call id-based endpoints
      const profile = getProfileFromToken(token);
      const id = profile && (profile.id || profile.sub || profile.userId || profile._id);
      if (!id) return Promise.reject(new Error('No user id found in token'));
      const res = await getUserById(id);
      return res.data
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

// Orders / checkout
export const createOrder = (order) => {
  // order: { items: [...], userId }
  return axios.post(`${API_BASE_URL}/api/orders`, order, getConfig())
}

// ------------------- Products CRUD -------------------
export const getProductById = (id) => {
  if (!id) return Promise.reject(new Error('Product id required'));
  return axios.get(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, getConfig());
}

// Flexible product catalog fetcher. Tries common endpoints and returns the axios response.
export async function getProductCatalog(params = {}) {
  const candidates = [
    `${API_BASE_URL}/api/products`,
    `${API_BASE_URL}/api/catalog/products`,
    `${API_BASE_URL}/api/catalog`,
    `${API_BASE_URL}/products`,
    `${API_BASE_URL}/api/products/all`
  ];
  let lastErr = null;
  for (const url of candidates) {
    // Try authenticated request first (if token present via interceptor/getConfig)
    try {
      const res = await axios.get(url, { ...getConfig(), params });
      if (res && res.data) return res;
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      // If auth failed or forbidden, try unauthenticated request (some endpoints are public)
      if (status === 401 || status === 403) {
        try {
          console.debug('[api] falling back to unauthenticated product catalog for', url);
          const res2 = await axios.get(url, { params });
          if (res2 && res2.data) return res2;
        } catch (err2) {
          lastErr = err2;
        }
      }
      // Otherwise continue to next candidate
    }
  }
  throw lastErr || new Error('No product catalog endpoint reachable');
}

// Flexible inventory fetcher: tries inventory/stock endpoints and returns axios response.
export async function getInventory(params = {}) {
  const candidates = [
    `${API_BASE_URL}/api/inventory`,
    `${API_BASE_URL}/api/stock`,
    `${API_BASE_URL}/api/stock-items`,
    `${API_BASE_URL}/api/stock-transactions`,
    `${API_BASE_URL}/api/inventory/items`
  ];
  let lastErr = null;
  for (const url of candidates) {
    try {
      const res = await axios.get(url, { ...getConfig(), params });
      if (res && res.data) return res;
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        try {
          console.debug('[api] falling back to unauthenticated inventory for', url);
          const res2 = await axios.get(url, { params });
          if (res2 && res2.data) return res2;
        } catch (err2) {
          lastErr = err2;
        }
      }
    }
  }
  throw lastErr || new Error('No inventory endpoint reachable');
}







































export const updateProduct = (id, product) => {
  if (!id) return Promise.reject(new Error('Product id required'));
  try {
    const token = getToken();
    const profile = getProfileFromToken(token);
    const vendor_id = profile && profile.id ? profile.id : undefined;
    // Build minimal payload matching entity
    const payload = {
      name: product.name ?? '',
      sku: product.sku ?? '',
      reorderLevel: typeof product.reorderLevel !== 'undefined' ? product.reorderLevel : Number(product.reorderLevel) || 0,
      currentStock: typeof product.currentStock !== 'undefined' ? product.currentStock : Number(product.currentStock) || 0,
      category: product.category ?? '',
    }


    // vendor resolution
    let vid = product.vendor_id ?? product.vendorId ?? product.vendor ?? vendor_id ?? null
    let vendorVal = null
    if (vid === null || vid === undefined) vendorVal = null
    else if (typeof vid === 'number') vendorVal = vid
    else if (typeof vid === 'string' && /^\d+$/.test(vid)) {
      const n = Number(vid)
      vendorVal = Number.isSafeInteger(n) ? n : vid
    } else vendorVal = vid

    payload.vendor_id = vendorVal ?? null

    console.debug('updateProduct payload', id, payload);
    return axios.put(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, payload, getConfig());
  } catch (err) {
    return axios.put(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, product, getConfig());
  }
}

export const deleteProduct = (id) => {
  if (!id) return Promise.reject(new Error('Product id required'));
  return axios.delete(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, getConfig());
}

// ------------------- Cart APIs -------------------
export const addToCart = (userId, productId) => {
  const payload = { userId, productId };
  return axios.post(`${API_BASE_URL}/cart/add`, payload, getConfig());
}

export const increaseCartQty = (userId, productId) => {
  const payload = { userId, productId };
  return axios.post(`${API_BASE_URL}/cart/increase`, payload, getConfig());
}

export const decreaseCartQty = (userId, productId) => {
  const payload = { userId, productId };
  return axios.post(`${API_BASE_URL}/cart/decrease`, payload, getConfig());
}

export const updateCartItem = (userId, productId, qty) => {
  const payload = { userId, productId, qty };
  return axios.put(`${API_BASE_URL}/cart/update`, payload, getConfig());
}

export const removeCartItem = (userId, productId) => {
  const payload = { userId, productId };
  return axios.delete(`${API_BASE_URL}/cart/remove`, { data: payload, ...getConfig() });
}

export const getCartItems = (userId) => {
  const params = userId ? { userId } : undefined;
  return axios.get(`${API_BASE_URL}/cart/items`, { ...getConfig(), params });
}

// Alternative cart helpers for backends that expect path variables
export const addToCartPath = (userId, productId) => {
  if (!userId || !productId) return Promise.reject(new Error('userId and productId required'));
  return axios.post(`${API_BASE_URL}/cart/add/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`, {}, getConfig());
}

export const increaseCartQtyPath = (userId, productId) => {
  if (!userId || !productId) return Promise.reject(new Error('userId and productId required'));
  return axios.post(`${API_BASE_URL}/cart/increase/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`, {}, getConfig());
}

export const decreaseCartQtyPath = (userId, productId) => {
  if (!userId || !productId) return Promise.reject(new Error('userId and productId required'));
  return axios.post(`${API_BASE_URL}/cart/decrease/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`, {}, getConfig());
}

export const updateCartItemPath = (userId, productId, qty) => {
  if (!userId || !productId) return Promise.reject(new Error('userId and productId required'));
  // some controllers might expect qty as path variable too
  if (typeof qty !== 'undefined' && qty !== null) {
    return axios.put(`${API_BASE_URL}/cart/update/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}/${encodeURIComponent(qty)}`, {}, getConfig());
  }
  return axios.put(`${API_BASE_URL}/cart/update/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`, {}, getConfig());
}

export const removeCartItemPath = (userId, productId) => {
  if (!userId || !productId) return Promise.reject(new Error('userId and productId required'));
  return axios.delete(`${API_BASE_URL}/cart/remove/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`, getConfig());
}

export const getCartItemsPath = (userId) => {
  if (!userId) return Promise.reject(new Error('userId required'));
  return axios.get(`${API_BASE_URL}/cart/items/${encodeURIComponent(userId)}`, getConfig());
}

// ------------------- Stock Transactions -------------------
export const createStockTransaction = (transaction) => axios.post(`${API_BASE_URL}/api/stock-transactions`, transaction, getConfig());
export const updateStockTransaction = (id, updated) => axios.put(`${API_BASE_URL}/api/stock-transactions/${encodeURIComponent(id)}`, updated, getConfig());
export const getAllStockTransactions = () => axios.get(`${API_BASE_URL}/api/stock-transactions`, getConfig());
export const getStockTransactionById = (id) => axios.get(`${API_BASE_URL}/api/stock-transactions/${encodeURIComponent(id)}`, getConfig());
export const getStockTransactionsByVendor = (vendorId) => axios.get(`${API_BASE_URL}/api/stock-transactions/vendor/${encodeURIComponent(vendorId)}`, getConfig());
