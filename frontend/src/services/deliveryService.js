import api from './api';

export const deliveryService = {
  checkDelivery: async (pincode, category = null, product_id = null, metal_type = null) => {
    const params = { pincode };
    if (category) params.category = category;
    if (product_id) params.product_id = product_id;
    if (metal_type) params.metal_type = metal_type;
    
    const response = await api.get('/delivery/check', { params });
    return response.data;
  },
};

