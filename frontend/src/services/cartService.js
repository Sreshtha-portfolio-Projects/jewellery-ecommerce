import api from './api';

export const cartService = {
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
