import api from './api';

export const productPairingService = {
  getPairedProducts: async (productId, type = 'related', limit = 4) => {
    const response = await api.get(`/product-pairings/product/${productId}`, {
      params: { type, limit }
    });
    return response.data;
  },
};

