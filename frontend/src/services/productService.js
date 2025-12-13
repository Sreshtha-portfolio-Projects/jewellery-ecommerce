import api from './api';

export const productService = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await api.get(`/products?category=${category}`);
    return response.data;
  },
};

