import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getOrderConfirmation: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/confirmation`);
    return response.data;
  },

  getOrderInvoice: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response.data;
  },

  cancelOrder: async (orderId, reason) => {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};

