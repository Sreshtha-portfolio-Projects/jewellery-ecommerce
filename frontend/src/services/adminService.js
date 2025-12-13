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
};
