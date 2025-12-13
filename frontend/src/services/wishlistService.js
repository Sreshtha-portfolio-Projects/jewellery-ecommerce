import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await api.post('/wishlist', { productId });
    return response.data;
  },

  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },

  isInWishlist: async (productId) => {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data.inWishlist;
  },
};

