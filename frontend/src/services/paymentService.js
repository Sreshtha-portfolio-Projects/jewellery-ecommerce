import api from './api';

export const paymentService = {
  /**
   * Create Razorpay payment order from order intent
   * @param {string} orderIntentId - Order intent ID to create payment for
   * @returns {Promise} Razorpay order details
   */
  createPaymentOrder: async (orderIntentId) => {
    const response = await api.post('/payments/create-order', { orderIntentId });
    return response.data;
  },

  /**
   * Verify payment signature and convert order intent to order
   * @param {string} orderIntentId - Order intent ID
   * @param {Object} paymentData - Payment details from Razorpay
   * @returns {Promise} Verification result with order details
   */
  verifyPayment: async (orderIntentId, paymentData) => {
    const response = await api.post('/payments/verify-payment', {
      orderIntentId,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_signature: paymentData.razorpay_signature
    });
    return response.data;
  }
};

