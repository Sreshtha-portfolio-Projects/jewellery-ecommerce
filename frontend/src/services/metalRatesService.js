/**
 * Metal Rates Service — Frontend API client (admin only)
 *
 * All calls go through the backend. No direct calls to MetalPriceAPI.
 */
import api from './api';

export const metalRatesService = {
  /**
   * Get current stored gold and silver rates from DB.
   */
  getCurrentRates: async () => {
    const response = await api.get('/admin/metal-rates');
    return response.data;
  },

  /**
   * Trigger a live fetch from MetalPriceAPI and store in DB.
   * Returns updated rates on success, or last stored rates on API failure.
   */
  triggerUpdate: async () => {
    const response = await api.post('/admin/metal-rates/update');
    return response.data;
  },

  /**
   * Get rate change history for a metal.
   * @param {'gold'|'silver'} metal
   * @param {number} limit - max rows (default 30)
   */
  getHistory: async (metal = 'gold', limit = 30) => {
    const response = await api.get('/admin/metal-rates/history', {
      params: { metal, limit },
    });
    return response.data;
  },

  /**
   * Bulk-recalculate product prices using the latest stored metal rates.
   * Only affects products that have use_live_rate === true on metal entries.
   */
  recalculateProducts: async () => {
    const response = await api.post('/admin/metal-rates/recalculate-products');
    return response.data;
  },
};
