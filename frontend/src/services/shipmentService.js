import api from './api';

export const shipmentService = {
  getShipment: async (orderId) => {
    const response = await api.get(`/shipments/${orderId}`);
    return response.data;
  },

  updateTracking: async (orderId) => {
    const response = await api.get(`/shipments/${orderId}/tracking`);
    return response.data;
  },
};

