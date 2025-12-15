import api from './api';

export const orderIntentService = {
  createOrderIntent: async (shippingAddressId, billingAddressId, discountCode) => {
    const response = await api.post('/order-intents', {
      shippingAddressId,
      billingAddressId,
      discountCode
    });
    return response.data;
  },

  getOrderIntent: async (id) => {
    const response = await api.get(`/order-intents/${id}`);
    return response.data;
  },

  getUserOrderIntents: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/order-intents', { params });
    return response.data;
  },

  cancelOrderIntent: async (id) => {
    const response = await api.post(`/order-intents/${id}/cancel`);
    return response.data;
  },
};

