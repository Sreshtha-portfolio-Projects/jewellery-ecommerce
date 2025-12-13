import api from './api';

export const discountService = {
  validateDiscount: async (code, cartValue) => {
    const response = await api.post('/discounts/validate', { code, cartValue });
    return response.data;
  },
};

