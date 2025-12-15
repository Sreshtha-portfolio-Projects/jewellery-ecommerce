import api from './api';

export const adminService = {
  checkHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },

  getDashboardKPIs: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/admin/dashboard/kpis', { params });
    return response.data;
  },

  getRevenueByMetalType: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/admin/analytics/revenue-by-metal', { params });
    return response.data;
  },

  getSalesComparison: async (period = 'monthly') => {
    const response = await api.get('/admin/analytics/sales-comparison', { params: { period } });
    return response.data;
  },

  getLowStockProducts: async (threshold = 10) => {
    const response = await api.get('/admin/products/low-stock', { params: { threshold } });
    return response.data;
  },

  getAllOrders: async (status, startDate, endDate, page = 1, limit = 50) => {
    const params = { page, limit };
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getOrderDetails: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status, notes) => {
    const response = await api.put(`/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Product Management
  getAllProducts: async (page = 1, limit = 50, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  // Variants
  createVariant: async (productId, variantData) => {
    const response = await api.post(`/admin/products/${productId}/variants`, variantData);
    return response.data;
  },

  updateVariant: async (variantId, variantData) => {
    const response = await api.put(`/admin/products/variants/${variantId}`, variantData);
    return response.data;
  },

  deleteVariant: async (variantId) => {
    const response = await api.delete(`/admin/products/variants/${variantId}`);
    return response.data;
  },

  // Images
  uploadProductImage: async (productId, imageData) => {
    const response = await api.post(`/admin/products/${productId}/images`, imageData);
    return response.data;
  },

  reorderImages: async (productId, imageIds) => {
    const response = await api.put(`/admin/products/${productId}/images/reorder`, { imageIds });
    return response.data;
  },

  deleteImage: async (imageId) => {
    const response = await api.delete(`/admin/products/images/${imageId}`);
    return response.data;
  },

  // Bulk Operations
  bulkImport: async (fileContent, importType = 'both') => {
    const response = await api.post('/admin/products/bulk-import', { fileContent, importType });
    return response.data;
  },

  bulkExport: async (exportType = 'both') => {
    const response = await api.get('/admin/products/bulk-export', {
      params: { exportType },
      responseType: 'blob'
    });
    return response.data;
  },

  // Pricing Rules
  getPricingRules: async (isActive) => {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await api.get('/admin/pricing-rules', { params });
    return response.data;
  },

  createPricingRule: async (ruleData) => {
    const response = await api.post('/admin/pricing-rules', ruleData);
    return response.data;
  },

  updatePricingRule: async (id, ruleData) => {
    const response = await api.put(`/admin/pricing-rules/${id}`, ruleData);
    return response.data;
  },

  deletePricingRule: async (id) => {
    const response = await api.delete(`/admin/pricing-rules/${id}`);
    return response.data;
  },
};
