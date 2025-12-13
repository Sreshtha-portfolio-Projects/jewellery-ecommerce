import api from './api';

export const addressService = {
  getAll: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  create: async (addressData) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  update: async (id, addressData) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};

