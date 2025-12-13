import api from './api';

export const customerAuthService = {
  signup: async (email, password, fullName) => {
    const response = await api.post('/auth/customer/signup', { email, password, fullName });
    if (response.data.token) {
      localStorage.setItem('customerToken', response.data.token);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/customer/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('customerToken', response.data.token);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/customer/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('customerToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('customerToken');
  },
};

