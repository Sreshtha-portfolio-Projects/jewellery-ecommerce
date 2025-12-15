const supabase = require('../config/supabase');
const { applyPricingRules } = require('../controllers/adminPricingController');

/**
 * Pricing Engine - All calculations done server-side
 * No hardcoded values - everything from admin_settings
 */
class PricingEngine {
  /**
   * Get setting value with type conversion
   */
  async getSetting(key, defaultValue = null) {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value, setting_type')
        .eq('setting_key', key)
        .single();

      if (!data) return defaultValue;

      const value = data.setting_value;
      switch (data.setting_type) {
        case 'number':
          return parseFloat(value) || defaultValue;
        case 'boolean':
          return value === 'true' || value === true;
        case 'json':
          return JSON.parse(value);
        default:
          return value || defaultValue;
      }
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Calculate tax amount
   */
  async calculateTax(subtotal, discountAmount = 0) {
    const taxPercentage = await this.getSetting('tax_percentage', 18);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercentage) / 100;
    return this.roundPrice(taxAmount);
  }

  /**
   * Calculate shipping charge
   */
  async calculateShipping(subtotal) {
    const freeShippingThreshold = await this.getSetting('free_shipping_threshold', 5000);
    const defaultShipping = await this.getSetting('shipping_charge', 0);

    if (subtotal >= freeShippingThreshold) {
      return 0;
    }

    return this.roundPrice(defaultShipping);
  }

  /**
   * Round price based on admin setting
   */
  async roundPrice(amount) {
    const method = await this.getSetting('price_rounding_method', 'round');
    
    switch (method) {
      case 'floor':
        return Math.floor(amount);
      case 'ceil':
        return Math.ceil(amount);
      case 'round':
      default:
        return Math.round(amount * 100) / 100; // Round to 2 decimals
    }
  }

  /**
   * Calculate final price for cart/order intent
   */
  async calculateFinalPrice(cartItems, discountCode = null, variantPrices = {}) {
    try {
      // 1. Calculate subtotal from cart items
      let subtotal = 0;
      const itemsWithPrices = [];

      for (const item of cartItems) {
        // Use variant price override if available, otherwise base price
        const itemPrice = variantPrices[item.variant_id]?.price_override 
          || variantPrices[item.variant_id]?.base_price
          || item.product?.base_price 
          || item.product?.price 
          || 0;

        // Apply pricing rules to item
        const finalItemPrice = await applyPricingRules(
          item.product,
          variantPrices[item.variant_id]
        );

        const itemSubtotal = finalItemPrice * item.quantity;
        subtotal += itemSubtotal;

        itemsWithPrices.push({
          ...item,
          unit_price: finalItemPrice,
          subtotal: itemSubtotal
        });
      }

      subtotal = await this.roundPrice(subtotal);

      // 2. Apply discount if provided
      let discountAmount = 0;
      let discountData = null;

      if (discountCode) {
        const discountResult = await this.validateAndApplyDiscount(
          discountCode,
          subtotal
        );
        if (discountResult.valid) {
          discountAmount = discountResult.discount_amount;
          discountData = discountResult.discount;
        }
      }

      // 3. Calculate tax (on subtotal - discount)
      const taxAmount = await this.calculateTax(subtotal, discountAmount);

      // 4. Calculate shipping
      const shippingCharge = await this.calculateShipping(subtotal - discountAmount);

      // 5. Calculate final total
      const totalAmount = await this.roundPrice(
        subtotal - discountAmount + taxAmount + shippingCharge
      );

      return {
        subtotal,
        discount_amount: discountAmount,
        discount: discountData,
        tax_amount: taxAmount,
        shipping_charge: shippingCharge,
        total_amount: totalAmount,
        items: itemsWithPrices,
        breakdown: {
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          shipping: shippingCharge,
          total: totalAmount
        }
      };
    } catch (error) {
      console.error('Error calculating final price:', error);
      throw new Error('Failed to calculate price');
    }
  }

  /**
   * Validate and apply discount
   */
  async validateAndApplyDiscount(code, cartTotal) {
    try {
      const { data: discount, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !discount) {
        return { valid: false, message: 'Invalid discount code' };
      }

      // Check expiry
      if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
        return { valid: false, message: 'Discount code has expired' };
      }

      // Check minimum cart value (support both field names)
      const minCartValue = discount.min_cart_value || discount.minimum_cart_value || 0;
      if (minCartValue && cartTotal < minCartValue) {
        return {
          valid: false,
          message: `Minimum cart value of ₹${minCartValue} required`
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = (cartTotal * discount.discount_value) / 100;
      } else if (discount.discount_type === 'flat') {
        discountAmount = discount.discount_value;
      }
      
      // Ensure discount doesn't exceed cart total
      discountAmount = Math.min(discountAmount, cartTotal);

      discountAmount = await this.roundPrice(discountAmount);

      return {
        valid: true,
        discount,
        discount_amount: discountAmount
      };
    } catch (error) {
      console.error('Error validating discount:', error);
      return { valid: false, message: 'Error validating discount code' };
    }
  }

  /**
   * Get all pricing settings for frontend display
   */
  async getPricingSettings() {
    const settings = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, setting_type, category')
      .in('category', ['pricing', 'tax', 'shipping']);

    const result = {};
    (settings.data || []).forEach(setting => {
      let value = setting.setting_value;
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === true;
      }
      result[setting.setting_key] = value;
    });

    return result;
  }
}

module.exports = new PricingEngine();

