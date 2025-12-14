import api from './api';

export const customerAuthService = {
  signup: async (email, password, fullName, mobile) => {
    const response = await api.post('/auth/signup', { email, password, fullName, mobile });
    if (response.data.token) {
      localStorage.setItem('customerToken', response.data.token);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('customerToken', response.data.token);
    }
    return response.data;
  },

  googleLogin: async () => {
    const frontendUrl = window.location.origin;
    const response = await api.post('/auth/google', { redirectTo: `${frontendUrl}/auth/callback` });
    // Redirect to Google OAuth URL
    window.location.href = response.data.url;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('customerToken');
    }
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('customerToken');
  },
};

