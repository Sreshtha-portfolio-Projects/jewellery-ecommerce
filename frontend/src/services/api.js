import axios from 'axios';

/**
 * Get API base URL based on environment
 * - Uses VITE_API_BASE_URL if set (via .env files or Vercel env vars)
 * - Auto-detects localhost and uses local backend
 * - Falls back to production backend for deployed frontend
 */
const getApiBaseUrl = () => {
  // If explicitly set in env, use it (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect: if running on localhost, use local backend
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  
  // Otherwise use production backend (for Vercel deployment)
  return 'https://jewellery-ecommerce-9xs1.onrender.com';
};

// Normalize API base URL - remove trailing slash if present
const rawApiBaseUrl = getApiBaseUrl();
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, ''); // Remove trailing slashes

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (check both admin and customer tokens)
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const customerToken = localStorage.getItem('customerToken');
    const token = adminToken || customerToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Disable caching for GET requests (especially important in development)
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
      // Add timestamp to prevent browser caching
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (missing/invalid token)
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('customerToken');
        // Don't redirect on public pages
        if (path.startsWith('/profile') || path.startsWith('/cart') || path.startsWith('/wishlist')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 403 Forbidden (token from different environment - JWT_SECRET mismatch)
    if (error.response?.status === 403 && error.response?.data?.message?.includes('token')) {
      console.warn('Token validation failed - likely JWT_SECRET mismatch between environments');
      console.warn('Current API URL:', API_BASE_URL);
      console.warn('Tip: Clear localStorage and login again, or check environment configuration');
      
      // Only clear tokens if we're on a protected route
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/admin/login')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('customerToken');
        localStorage.removeItem('adminToken');
        if (path.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

