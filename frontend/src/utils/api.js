import axios from 'axios';

/** When the API is on another origin, HttpOnly cookies may not attach; Bearer backs up auth (tab‑scoped). */
export const MINIS_BEARER_KEY = 'minis_bearer';

export function setBearerToken(token) {
  if (typeof window === 'undefined') return;
  if (token) sessionStorage.setItem(MINIS_BEARER_KEY, token);
  else sessionStorage.removeItem(MINIS_BEARER_KEY);
}

export function clearBearerToken() {
  setBearerToken('');
}

// Backend serves `/api/...` (canonical). Same routers are also mounted at `/...` for backwards compatibility.
// With empty env in dev, use `/api` so Vite proxy forwards to the Express server.
const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
// Always use `/api` as path prefix when no absolute API origin is set (Vite dev proxy; static hosts with `/api` rewrites).
const baseURL =
  raw === ''
    ? '/api'
    : raw.endsWith('/api')
      ? raw
      : `${raw}/api`;

const API = axios.create({
  baseURL,
  withCredentials: true,
});

async function axiosUntil(optionsFactories, axiosCallable = (...args) => API(...args)) {
  let lastErr;
  for (const opts of optionsFactories) {
    try {
      const config = typeof opts === 'function' ? opts() : opts;
      return await axiosCallable(config);
    } catch (e) {
      lastErr = e;
      const st = e.response?.status;
      const msg = e.response?.data?.message;
      const isBackend404 =
        st === 404 &&
        (typeof msg === 'string'
          ? msg.includes('Route not found')
          : typeof msg === 'object' && msg?.message?.includes?.('Route not found'));
      if (isBackend404) continue;
      throw e;
    }
  }
  throw lastErr;
}

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = sessionStorage.getItem(MINIS_BEARER_KEY);
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Products
export const getProducts = (params) => API.get('/products', { params });
export const getFeaturedProducts = () => API.get('/products/featured');
export const getProduct = (id) => API.get(`/products/${id}`);

export const addReview = (id, data) =>
  API.post(`/products/${id}/reviews`, data);

export const updateReview = (id, data) =>
  API.put(`/products/${id}/reviews`, data);

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const logoutUser = () => API.post('/auth/logout');
export const registerUser = (data) => API.post('/auth/register', data);
export const getRegisterOptions = () =>
  axiosUntil([
    { method: 'get', url: '/mail/register-options' },
    { method: 'get', url: '/auth/register-options' },
    { method: 'get', url: '/auth/register/options' },
  ]);
export const sendRegisterPhoneCode = (data) =>
  API.post('/auth/register/send-phone-code', data);
export const verifyEmail = (params) =>
  API.get('/auth/verify-email', { params });
export const verifyEmailOtp = (data) => API.post('/auth/verify-email-otp', data);
export const resendEmailVerification = (data) =>
  axiosUntil([
    { method: 'post', url: '/mail/resend', data },
    { method: 'post', url: '/auth/resend-email-verification', data },
    { method: 'post', url: '/auth/resend-verification', data },
    { method: 'post', url: '/auth/resend', data },
  ]);
export const resendVerification = resendEmailVerification;
export const getProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Orders
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my');
export const getOrder = (id) => API.get(`/orders/${id}`);

export const downloadOrderInvoice = (id) =>
  API.get(`/orders/${id}/invoice`, {
    responseType: "blob",
  });

// Coupons
export const validateCoupon = (data) => API.post('/coupons/validate', data);

// Public Coupons - Customer-facing offers
export const getPublicCoupons = () => API.get('/coupons/public');

// Admin Coupons
export const getAdminCoupons = () => API.get('/coupons');

export const createAdminCoupon = (data) => API.post('/coupons', data);

export const updateAdminCoupon = (id, data) =>
  API.patch(`/coupons/${id}`, data);

export const deleteAdminCoupon = (id) => API.delete(`/coupons/${id}`);

// Contact
export const sendContact = (data) => API.post('/contact', data);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminLowStockProducts = () => API.get("/admin/inventory/low-stock");
export const getAdminProducts = (params) => API.get('/admin/products', { params });
export const createAdminProduct = (data) => API.post('/admin/products', data);
export const updateAdminProduct = (id, data) => API.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => API.delete(`/admin/products/${id}`);
export const getAdminOrders = (params) => API.get('/admin/orders', { params });
export const markAdminOrderAsPaid = (id) => API.patch(`/orders/${id}/pay`);
export const updateAdminOrderStatus = (id, status) => API.put(`/admin/orders/${id}/status`, { status });
export const deleteAdminOrder = (id) => API.delete(`/admin/orders/${id}`);
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const updateAdminUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);

// Wishlist Sharing
export const getMyWishlistShare = () =>
  API.get("/wishlist-share");

export const createWishlistShare = (productIds) =>
  API.post("/wishlist-share", { productIds });

export const syncWishlistShare = (productIds) =>
  API.put("/wishlist-share/sync", { productIds });

export const revokeWishlistShare = () =>
  API.delete("/wishlist-share");

export const getPublicWishlistShare = (token) =>
  API.get(`/wishlist-share/public/${encodeURIComponent(token)}`);

export default API;
