const supabase = require('../config/supabase');
const pricingEngine = require('./pricingEngine');

/**
 * Cart Revalidation Engine
 * Validates cart before creating order intent
 */
class CartRevalidationService {
  /**
   * Revalidate entire cart
   * Returns validation result with mismatches
   */
  async revalidateCart(cartItems, discountCode = null) {
    const validationResult = {
      valid: true,
      errors: [],
      warnings: [],
      updatedItems: [],
      priceChanged: false,
      stockUnavailable: false
    };

    try {
      // Get all variant IDs
      const variantIds = cartItems
        .map(item => item.variant_id || item.product_id)
        .filter(Boolean);

      if (variantIds.length === 0) {
        validationResult.valid = false;
        validationResult.errors.push('Cart is empty');
        return validationResult;
      }

      // Fetch current variant data
      const { data: variants } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(*)
        `)
        .in('id', variantIds);

      const variantMap = {};
      (variants || []).forEach(v => {
        variantMap[v.id] = v;
      });

      // Validate each cart item
      for (const item of cartItems) {
        const variantId = item.variant_id || item.product_id;
        const variant = variantMap[variantId];

        if (!variant) {
          validationResult.valid = false;
          validationResult.errors.push(`Variant ${variantId} no longer exists`);
          continue;
        }

        // Check if variant is active
        if (!variant.is_active) {
          validationResult.valid = false;
          validationResult.errors.push(`Variant ${variantId} is no longer available`);
          continue;
        }

        // Check if product is active
        if (!variant.product?.is_active) {
          validationResult.valid = false;
          validationResult.errors.push(`Product ${variant.product?.name} is no longer available`);
          continue;
        }

        // Check stock availability (considering locked inventory)
        const availableStock = await this.getAvailableStock(variantId);
        if (availableStock < item.quantity) {
          validationResult.valid = false;
          validationResult.stockUnavailable = true;
          validationResult.errors.push(
            `Insufficient stock for ${variant.product?.name}. Available: ${availableStock}, Requested: ${item.quantity}`
          );
          continue;
        }

        // Check price changes
        const currentPrice = variant.price_override || variant.product?.base_price || variant.product?.price || 0;
        const itemPrice = item.product?.price || item.unit_price || 0;

        if (Math.abs(currentPrice - itemPrice) > 0.01) {
          validationResult.priceChanged = true;
          validationResult.warnings.push(
            `Price changed for ${variant.product?.name}. Old: ₹${itemPrice}, New: ₹${currentPrice}`
          );
          validationResult.updatedItems.push({
            ...item,
            product: variant.product,
            variant: variant,
            new_price: currentPrice
          });
        }
      }

      // Validate discount code if provided
      if (discountCode) {
        const subtotal = cartItems.reduce((sum, item) => {
          const variantId = item.variant_id || item.product_id;
          const variant = variantMap[variantId];
          const price = variant?.price_override || variant?.product?.base_price || item.product?.price || 0;
          return sum + (price * item.quantity);
        }, 0);

        const discountValidation = await pricingEngine.validateAndApplyDiscount(
          discountCode,
          subtotal
        );

        if (!discountValidation.valid) {
          validationResult.valid = false;
          validationResult.errors.push(discountValidation.message || 'Discount code is invalid');
        }
      }

      return validationResult;
    } catch (error) {
      console.error('Error revalidating cart:', error);
      validationResult.valid = false;
      validationResult.errors.push('Error validating cart');
      return validationResult;
    }
  }

  /**
   * Get available stock (total - locked)
   */
  async getAvailableStock(variantId) {
    try {
      // Get variant stock
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single();

      if (!variant) return 0;

      // Get locked quantity
      const { data: locks } = await supabase
        .from('inventory_locks')
        .select('quantity_locked')
        .eq('variant_id', variantId)
        .eq('status', 'LOCKED')
        .gt('expires_at', new Date().toISOString());

      const lockedQuantity = (locks || []).reduce((sum, lock) => sum + lock.quantity_locked, 0);

      return Math.max(0, variant.stock_quantity - lockedQuantity);
    } catch (error) {
      console.error('Error getting available stock:', error);
      return 0;
    }
  }

  /**
   * Check if checkout is enabled
   */
  async isCheckoutEnabled() {
    const checkoutEnabled = await pricingEngine.getSetting('checkout_enabled', true);
    const maintenanceMode = await pricingEngine.getSetting('maintenance_mode', false);
    return checkoutEnabled && !maintenanceMode;
  }
}

module.exports = new CartRevalidationService();

