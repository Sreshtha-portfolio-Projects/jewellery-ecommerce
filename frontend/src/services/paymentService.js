import api from './api';

export const paymentService = {
  createOrder: async (orderData) => {
    const response = await api.post('/payments/create-order', orderData);
    return response.data;
  },
};

