import api from './api';

export const reviewService = {
  getProductReviews: async (productId, limit = 10, offset = 0) => {
    const response = await api.get(`/reviews/product/${productId}`, {
      params: { limit, offset }
    });
    return response.data;
  },

  createReview: async (productId, rating, reviewText) => {
    const response = await api.post(`/reviews/product/${productId}`, {
      rating,
      reviewText
    });
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

