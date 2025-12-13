import api from './api';

export const adminService = {
  checkHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },
};

