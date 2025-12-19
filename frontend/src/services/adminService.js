import api from './api';

export const adminService = {
  checkHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/health');
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

  // Admin Settings
  getSettings: async (category) => {
    const params = category ? { category } : {};
    const response = await api.get('/admin/settings', { params });
    return response.data;
  },

  updateSetting: async (key, value) => {
    const response = await api.put(`/admin/settings/${key}`, { value });
    return response.data;
  },

  bulkUpdateSettings: async (settings) => {
    const response = await api.put('/admin/settings/bulk', { settings });
    return response.data;
  },

  // Inventory Management
  getInventoryLocks: async (status, variantId) => {
    const params = {};
    if (status) params.status = status;
    if (variantId) params.variant_id = variantId;
    const response = await api.get('/admin/inventory/locks', { params });
    return response.data;
  },

  getInventorySummary: async () => {
    const response = await api.get('/admin/inventory/summary');
    return response.data;
  },

  releaseInventoryLock: async (lockId) => {
    const response = await api.post(`/admin/inventory/locks/${lockId}/release`);
    return response.data;
  },

  // Abandoned Carts
  getAbandonedCarts: async (status, limit = 50) => {
    const params = { limit };
    if (status) params.status = status;
    const response = await api.get('/admin/abandoned-carts', { params });
    return response.data;
  },

  getAbandonedCartStats: async () => {
    const response = await api.get('/admin/abandoned-carts/stats');
    return response.data;
  },

  // Shipping Management
  updateShippingStatus: async (orderId, status, notes) => {
    const response = await api.post(`/admin/orders/${orderId}/shipping/status`, { status, notes });
    return response.data;
  },

  createShipment: async (orderId, courierName, trackingNumber, notes) => {
    const response = await api.post(`/admin/orders/${orderId}/shipping/create`, {
      courier_name: courierName,
      tracking_number: trackingNumber,
      notes
    });
    return response.data;
  },

  updateShipmentDetails: async (orderId, courierName, trackingNumber, notes, reason) => {
    const response = await api.put(`/admin/orders/${orderId}/shipping/details`, {
      courier_name: courierName,
      tracking_number: trackingNumber,
      notes,
      reason
    });
    return response.data;
  },

  getShippingHistory: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}/shipping/history`);
    return response.data;
  },

  getNextValidStatuses: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}/shipping/next-statuses`);
    return response.data;
  },

  // Delivery Zone Management
  getAllDeliveryZones: async (pincode, category, productId, page = 1, limit = 50) => {
    const params = { page, limit };
    if (pincode) params.pincode = pincode;
    if (category) params.category = category;
    if (productId) params.product_id = productId;
    const response = await api.get('/admin/delivery-zones', { params });
    return response.data;
  },

  getDeliveryZoneById: async (id) => {
    const response = await api.get(`/admin/delivery-zones/${id}`);
    return response.data;
  },

  createDeliveryZone: async (zoneData) => {
    const response = await api.post('/admin/delivery-zones', zoneData);
    return response.data;
  },

  updateDeliveryZone: async (id, zoneData) => {
    const response = await api.put(`/admin/delivery-zones/${id}`, zoneData);
    return response.data;
  },

  deleteDeliveryZone: async (id) => {
    const response = await api.delete(`/admin/delivery-zones/${id}`);
    return response.data;
  },

  bulkImportDeliveryZones: async (zones) => {
    const response = await api.post('/admin/delivery-zones/bulk-import', { zones });
    return response.data;
  },

  getDeliveryZoneFilters: async () => {
    const response = await api.get('/admin/delivery-zones/filters');
    return response.data;
  },

  // Returns Management
  getAllReturnRequests: async (status, page = 1, limit = 50) => {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/admin/returns', { params });
    return response.data;
  },

  getReturnRequestDetails: async (id) => {
    const response = await api.get(`/admin/returns/${id}`);
    return response.data;
  },

  approveReturnRequest: async (id, returnInstructions, returnAddress) => {
    const response = await api.put(`/admin/returns/${id}/approve`, {
      returnInstructions,
      returnAddress
    });
    return response.data;
  },

  rejectReturnRequest: async (id, rejectionReason) => {
    const response = await api.put(`/admin/returns/${id}/reject`, {
      rejectionReason
    });
    return response.data;
  },

  markReturnReceived: async (id) => {
    const response = await api.put(`/admin/returns/${id}/received`);
    return response.data;
  },

  initiateRefund: async (id) => {
    const response = await api.put(`/admin/returns/${id}/initiate-refund`);
    return response.data;
  },

  completeRefund: async (id, refundReference) => {
    const response = await api.put(`/admin/returns/${id}/complete-refund`, {
      refundReference
    });
    return response.data;
  },
};
