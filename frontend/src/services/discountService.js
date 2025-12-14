import api from './api';

export const discountService = {
  getAll: async () => {
    const response = await api.get('/discounts');
    return response.data;
  },

  validateDiscount: async (code, cartValue) => {
    const response = await api.post('/discounts/validate', { code, cartValue });
    return response.data;
  },

  create: async (discountData) => {
    const response = await api.post('/discounts', discountData);
    return response.data;
  },

  update: async (id, discountData) => {
    const response = await api.put(`/discounts/${id}`, discountData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },
};

