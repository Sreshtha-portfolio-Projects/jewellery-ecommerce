import api from './api';

export const deliveryService = {
  checkDelivery: async (pincode) => {
    const response = await api.get('/delivery/check', {
      params: { pincode }
    });
    return response.data;
  },
};

