const supabase = require('../config/supabase');

/**
 * Configuration Service - Central source of truth for all business rules
 * Reads from admin_settings table with intelligent caching
 */
class ConfigService {
  constructor() {
    this.cache = {};
    this.cacheTime = 60000; // 1 minute cache
    this.lastFetch = {};
  }

  /**
   * Get setting value with type conversion and caching
   */
  async getSetting(key, defaultValue = null) {
    try {
      // Check cache first
      const cacheKey = key;
      const now = Date.now();
      if (this.cache[cacheKey] && (now - this.lastFetch[cacheKey]) < this.cacheTime) {
        return this.cache[cacheKey];
      }

      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value, setting_type')
        .eq('setting_key', key)
        .single();

      if (!data) {
        this.cache[cacheKey] = defaultValue;
        this.lastFetch[cacheKey] = now;
        return defaultValue;
      }

      let value = data.setting_value;
      switch (data.setting_type) {
        case 'number':
          value = parseFloat(value) || defaultValue;
          break;
        case 'boolean':
          value = value === 'true' || value === true;
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = defaultValue;
          }
          break;
        default:
          value = value || defaultValue;
      }

      this.cache[cacheKey] = value;
      this.lastFetch[cacheKey] = now;
      return value;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get order status transitions from config
   */
  async getOrderStatusTransitions() {
    const transitions = await this.getSetting('order_status_transitions', {
      CREATED: ['paid', 'cancelled', 'shipped'],
      pending: ['paid', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      shipped: ['delivered', 'returned'],
      delivered: ['returned'],
      returned: [],
      cancelled: []
    });
    return transitions;
  }

  /**
   * Validate order status transition
   */
  async validateOrderTransition(fromStatus, toStatus) {
    const transitions = await this.getOrderStatusTransitions();
    const allowed = transitions[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Get shipping status transitions from config
   */
  async getShippingStatusTransitions() {
    const transitions = await this.getSetting('shipping_status_transitions', {
      NOT_SHIPPED: ['PROCESSING'],
      PROCESSING: ['SHIPPED'],
      SHIPPED: ['IN_TRANSIT'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: ['RETURNED'],
      RETURNED: []
    });
    return transitions;
  }

  /**
   * Validate shipping status transition
   */
  async validateShippingTransition(fromStatus, toStatus) {
    if (!fromStatus) {
      fromStatus = 'NOT_SHIPPED';
    }
    const transitions = await this.getShippingStatusTransitions();
    const allowed = transitions[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Get next valid shipping statuses
   */
  async getNextShippingStatuses(currentStatus) {
    if (!currentStatus) {
      currentStatus = 'NOT_SHIPPED';
    }
    const transitions = await this.getShippingStatusTransitions();
    return transitions[currentStatus] || [];
  }

  /**
   * Get return status transitions from config
   */
  async getReturnStatusTransitions() {
    const transitions = await this.getSetting('return_status_transitions', {
      NONE: ['REQUESTED'],
      REQUESTED: ['APPROVED', 'REJECTED'],
      APPROVED: ['RECEIVED'],
      REJECTED: [],
      RECEIVED: ['REFUND_INITIATED'],
      REFUND_INITIATED: ['REFUNDED'],
      REFUNDED: []
    });
    return transitions;
  }

  /**
   * Validate return status transition
   */
  async validateReturnTransition(fromStatus, toStatus) {
    const transitions = await this.getReturnStatusTransitions();
    const allowed = transitions[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Clear cache (useful after settings update)
   */
  clearCache(key = null) {
    if (key) {
      delete this.cache[key];
      delete this.lastFetch[key];
    } else {
      this.cache = {};
      this.lastFetch = {};
    }
  }

  /**
   * Get all business rule defaults
   */
  getDefaults() {
    return {
      tax_percentage: 18,
      shipping_charge: 0,
      free_shipping_threshold: 5000,
      return_window_days: 7,
      delivery_days_min: 3,
      delivery_days_max: 5,
      order_status_transitions: {
        CREATED: ['paid', 'cancelled', 'shipped'],
        pending: ['paid', 'cancelled'],
        paid: ['shipped', 'cancelled'],
        shipped: ['delivered', 'returned'],
        delivered: ['returned'],
        returned: [],
        cancelled: []
      },
      shipping_status_transitions: {
        NOT_SHIPPED: ['PROCESSING'],
        PROCESSING: ['SHIPPED'],
        SHIPPED: ['IN_TRANSIT'],
        IN_TRANSIT: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
        DELIVERED: ['RETURNED'],
        RETURNED: []
      },
      return_status_transitions: {
        NONE: ['REQUESTED'],
        REQUESTED: ['APPROVED', 'REJECTED'],
        APPROVED: ['RECEIVED'],
        REJECTED: [],
        RECEIVED: ['REFUND_INITIATED'],
        REFUND_INITIATED: ['REFUNDED'],
        REFUNDED: []
      }
    };
  }
}

module.exports = new ConfigService();
