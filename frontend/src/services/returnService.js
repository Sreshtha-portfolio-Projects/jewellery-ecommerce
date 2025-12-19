import api from './api';

export const returnService = {
  createReturnRequest: async (orderId, returnReason, returnNote) => {
    const response = await api.post('/returns', {
      orderId,
      returnReason,
      returnNote
    });
    return response.data;
  },

  getReturnRequestByOrder: async (orderId) => {
    const response = await api.get(`/returns/order/${orderId}`);
    return response.data;
  }
};
