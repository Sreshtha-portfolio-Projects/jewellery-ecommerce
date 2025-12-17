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
      if (cartItems.length === 0) {
        validationResult.valid = false;
        validationResult.errors.push('Cart is empty');
        return validationResult;
      }

      // Separate items with variants and items without variants
      const variantIds = cartItems
        .map(item => item.variant_id)
        .filter(Boolean);
      
      const productIds = cartItems
        .filter(item => !item.variant_id)
        .map(item => item.product_id)
        .filter(Boolean);

      // Fetch variant data for items with variants
      const variantMap = {};
      if (variantIds.length > 0) {
        const { data: variants } = await supabase
          .from('product_variants')
          .select(`
            *,
            product:products(*)
          `)
          .in('id', variantIds);

        (variants || []).forEach(v => {
          variantMap[v.id] = v;
        });
      }

      // Fetch product data for items without variants
      const productMap = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        (products || []).forEach(p => {
          productMap[p.id] = p;
        });
      }

      // Validate each cart item
      for (const item of cartItems) {
        let variant = null;
        let product = null;

        if (item.variant_id) {
          // Item has a variant
          variant = variantMap[item.variant_id];
          
          if (!variant) {
            validationResult.valid = false;
            validationResult.errors.push(`Variant ${item.variant_id} no longer exists`);
            continue;
          }

          product = variant.product;
        } else {
          // Item is direct product (no variant)
          product = productMap[item.product_id] || item.product;
          
          if (!product) {
            validationResult.valid = false;
            validationResult.errors.push(`Product ${item.product_id} no longer exists`);
            continue;
          }
        }

        // Check if variant is active (if applicable)
        if (variant && !variant.is_active) {
          validationResult.valid = false;
          validationResult.errors.push(`Variant ${item.variant_id} is no longer available`);
          continue;
        }

        // Check if product is active
        if (!product || !product.is_active) {
          validationResult.valid = false;
          validationResult.errors.push(`Product ${product?.name || 'Unknown'} is no longer available`);
          continue;
        }

        // Check stock availability
        const isVariant = !!item.variant_id;
        const itemId = item.variant_id || item.product_id;
        const availableStock = await this.getAvailableStock(itemId, isVariant);

        if (availableStock < item.quantity) {
          validationResult.valid = false;
          validationResult.stockUnavailable = true;
          validationResult.errors.push(
            `Insufficient stock for ${product?.name}. Available: ${availableStock}, Requested: ${item.quantity}`
          );
          continue;
        }

        // Check price changes
        const currentPrice = variant?.price_override || product?.base_price || product?.price || 0;
        const itemPrice = item.product?.price || item.unit_price || 0;

        if (Math.abs(currentPrice - itemPrice) > 0.01) {
          validationResult.priceChanged = true;
          validationResult.warnings.push(
            `Price changed for ${product?.name}. Old: ₹${itemPrice}, New: ₹${currentPrice}`
          );
          validationResult.updatedItems.push({
            ...item,
            product: product,
            variant: variant,
            new_price: currentPrice
          });
        }
      }

      // Validate discount code if provided
      if (discountCode) {
        const subtotal = cartItems.reduce((sum, item) => {
          let price = 0;
          
          if (item.variant_id) {
            const variant = variantMap[item.variant_id];
            price = variant?.price_override || variant?.product?.base_price || variant?.product?.price || 0;
          } else {
            const product = productMap[item.product_id] || item.product;
            price = product?.base_price || product?.price || 0;
          }
          
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
  async getAvailableStock(itemId, isVariant = true) {
    try {
      let totalStock = 0;

      if (isVariant) {
        // Get variant stock
        const { data: variant } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', itemId)
          .single();

        totalStock = variant?.stock_quantity || 0;
      } else {
        // Get product stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', itemId)
          .single();

        totalStock = product?.stock_quantity || 0;
      }

      // Get locked quantity
      const { data: locks } = await supabase
        .from('inventory_locks')
        .select('quantity_locked')
        .eq('variant_id', itemId)
        .eq('is_variant_lock', isVariant)
        .eq('status', 'LOCKED')
        .gt('expires_at', new Date().toISOString());

      const lockedQuantity = (locks || []).reduce((sum, lock) => sum + (lock.quantity_locked || 0), 0);

      return Math.max(0, totalStock - lockedQuantity);
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

