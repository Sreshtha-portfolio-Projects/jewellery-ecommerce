import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data.items || [];
  },

  addToCart: async (productId, quantity = 1, variantId = null) => {
    const payload = {
      productId: productId,
      quantity: quantity
    };
    
    if (variantId) {
      payload.variantId = variantId;
    }
    
    const response = await api.post('/cart', payload);
    return response.data;
  },

  updateQuantity: async (cartItemId, quantity) => {
    const response = await api.put(`/cart/${cartItemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (cartItemId) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },

  trackActivity: async () => {
    try {
      const response = await api.post('/cart/activity');
      return response.data;
    } catch (error) {
      // Don't throw - tracking is non-critical
      return { tracked: false };
    }
  },
};
