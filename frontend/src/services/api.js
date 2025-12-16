import axios from 'axios';

// Normalize API base URL - remove trailing slash if present
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
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
    return Promise.reject(error);
  }
);

export default api;

