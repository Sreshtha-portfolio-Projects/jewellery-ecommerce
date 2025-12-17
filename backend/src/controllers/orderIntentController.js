const supabase = require('../config/supabase');
const pricingEngine = require('../services/pricingEngine');
const cartRevalidationService = require('../services/cartRevalidationService');
const { v4: uuidv4 } = require('uuid');

/**
 * Create order intent from cart
 */
const createOrderIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId, billingAddressId, discountCode } = req.body;

    // Check if checkout is enabled
    const checkoutEnabled = await cartRevalidationService.isCheckoutEnabled();
    if (!checkoutEnabled) {
      return res.status(503).json({
        message: 'Checkout is currently disabled. Please try again later.',
        maintenance_mode: true
      });
    }

    // Get user's cart
    const { data: cartItems, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*)
      `)
      .eq('user_id', userId);

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return res.status(500).json({ message: 'Error fetching cart', error: cartError.message });
    }

    if (!cartItems || cartItems.length === 0) {
      console.log('Cart is empty for user:', userId);
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log('Cart items found:', cartItems.length, 'for user:', userId);

    // Revalidate cart
    const validation = await cartRevalidationService.revalidateCart(
      cartItems.map(item => ({
        ...item,
        variant_id: item.variant_id || item.variant?.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product,
        variant: item.variant
      })),
      discountCode
    );

    if (!validation.valid) {
      console.error('Cart validation failed for user:', userId, 'Errors:', validation.errors);
      return res.status(400).json({
        message: 'Cart validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
        requiresRefresh: true
      });
    }

    // Get variant prices for calculation
    const variantPrices = {};
    cartItems.forEach(item => {
      if (item.variant) {
        variantPrices[item.variant_id] = item.variant;
      }
    });

    // Calculate final price
    const priceCalculation = await pricingEngine.calculateFinalPrice(
      cartItems,
      discountCode,
      variantPrices
    );

    // Get lock duration
    const lockDurationMinutes = await pricingEngine.getSetting('inventory_lock_duration_minutes', 30);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + lockDurationMinutes);

    // Generate intent number
    const intentNumber = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create order intent
    const { data: orderIntent, error: intentError } = await supabase
      .from('order_intents')
      .insert({
        user_id: userId,
        intent_number: intentNumber,
        status: 'INTENT_CREATED',
        cart_snapshot: {
          items: cartItems,
          calculated_at: new Date().toISOString()
        },
        subtotal: priceCalculation.subtotal,
        discount_amount: priceCalculation.discount_amount,
        tax_amount: priceCalculation.tax_amount,
        shipping_charge: priceCalculation.shipping_charge,
        total_amount: priceCalculation.total_amount,
        discount_code: discountCode,
        discount_id: priceCalculation.discount?.id || null,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId || shippingAddressId,
        expires_at: expiresAt.toISOString(),
        metadata: {
          pricing_rules_applied: [],
          calculation_breakdown: priceCalculation.breakdown
        }
      })
      .select()
      .single();

    if (intentError) {
      console.error('Error creating order intent:', intentError);
      return res.status(500).json({ message: 'Failed to create order intent' });
    }

    // Lock inventory
    const lockResults = [];
    for (const item of cartItems) {
      const variantId = item.variant_id || item.variant?.id;
      const productId = item.product_id;
      let availableStock;

      if (variantId) {
        // Check variant stock
        availableStock = await cartRevalidationService.getAvailableStock(variantId);
        
        if (availableStock < item.quantity) {
          console.error('Insufficient stock for variant:', variantId, 'Available:', availableStock, 'Requested:', item.quantity);
          // Rollback order intent
          await supabase.from('order_intents').delete().eq('id', orderIntent.id);
          return res.status(400).json({
            message: `Insufficient stock for item. Available: ${availableStock}`,
            requiresRefresh: true
          });
        }

        // Create inventory lock for variant
        const { data: lock, error: lockError } = await supabase
          .from('inventory_locks')
          .insert({
            order_intent_id: orderIntent.id,
            variant_id: variantId,
            quantity_locked: item.quantity,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (lockError) {
          console.error('Error locking inventory:', lockError);
          // Rollback order intent
          await supabase.from('order_intents').delete().eq('id', orderIntent.id);
          return res.status(500).json({ message: 'Failed to lock inventory' });
        }

        // Deduct variant stock
        await supabase.rpc('decrement_stock', {
          variant_id: variantId,
          quantity: item.quantity
        });

        lockResults.push(lock);
      } else {
        // Product without variant - check product stock
        const { data: productData } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();

        availableStock = productData?.stock_quantity || 0;

        // Check existing locks for this product
        const { data: existingLocks } = await supabase
          .from('inventory_locks')
          .select('quantity_locked')
          .eq('variant_id', productId) // Using variant_id column to store product_id for non-variant items
          .eq('status', 'LOCKED')
          .gt('expires_at', new Date().toISOString());

        const lockedQty = (existingLocks || []).reduce((sum, lock) => sum + (lock.quantity_locked || 0), 0);
        availableStock = Math.max(0, availableStock - lockedQty);

        if (availableStock < item.quantity) {
          console.error('Insufficient stock for product:', productId, 'Available:', availableStock, 'Requested:', item.quantity);
          // Rollback order intent
          await supabase.from('order_intents').delete().eq('id', orderIntent.id);
          return res.status(400).json({
            message: `Insufficient stock for item. Available: ${availableStock}`,
            requiresRefresh: true
          });
        }

        // Create inventory lock for product (using variant_id column to store product_id)
        const { data: lock, error: lockError } = await supabase
          .from('inventory_locks')
          .insert({
            order_intent_id: orderIntent.id,
            variant_id: productId, // Store product_id in variant_id column for non-variant items
            quantity_locked: item.quantity,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (lockError) {
          console.error('Error locking product inventory:', lockError);
          // Rollback order intent
          await supabase.from('order_intents').delete().eq('id', orderIntent.id);
          return res.status(500).json({ message: 'Failed to lock inventory' });
        }

        // Deduct product stock
        await supabase
          .from('products')
          .update({
            stock_quantity: Math.max(0, (productData?.stock_quantity || 0) - item.quantity)
          })
          .eq('id', productId);

        lockResults.push(lock);
      }
    }

    // Lock discount code if used
    if (priceCalculation.discount?.id) {
      await supabase
        .from('discounts')
        .update({
          locked_by_intent_id: orderIntent.id,
          locked_until: expiresAt.toISOString()
        })
        .eq('id', priceCalculation.discount.id);
    }

    // Log pricing calculation
    await supabase.from('pricing_calculation_logs').insert({
      order_intent_id: orderIntent.id,
      calculation_type: 'order_intent',
      base_price: priceCalculation.subtotal,
      discount_applied: priceCalculation.discount,
      tax_calculation: {
        percentage: await pricingEngine.getSetting('tax_percentage', 18),
        amount: priceCalculation.tax_amount
      },
      shipping_calculation: {
        charge: priceCalculation.shipping_charge
      },
      final_price: priceCalculation.total_amount
    });

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'order_intent_created',
      entity_type: 'order_intent',
      entity_id: orderIntent.id,
      new_values: {
        intent_number: intentNumber,
        total_amount: priceCalculation.total_amount
      }
    });

    res.status(201).json({
      message: 'Order intent created successfully',
      order_intent: {
        ...orderIntent,
        expires_at: expiresAt.toISOString(),
        expires_in_minutes: lockDurationMinutes
      },
      pricing: priceCalculation.breakdown,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('Error in createOrderIntent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get order intent by ID
 */
const getOrderIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: orderIntent, error } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !orderIntent) {
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Check if expired
    if (orderIntent.status === 'INTENT_CREATED' && new Date(orderIntent.expires_at) < new Date()) {
      // Auto-expire
      await supabase
        .from('order_intents')
        .update({ status: 'EXPIRED' })
        .eq('id', id);
      orderIntent.status = 'EXPIRED';
    }

    res.json({ order_intent: orderIntent });
  } catch (error) {
    console.error('Error in getOrderIntent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's order intents
 */
const getUserOrderIntents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let query = supabase
      .from('order_intents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: intents, error } = await query;

    if (error) {
      console.error('Error fetching order intents:', error);
      return res.status(500).json({ message: 'Error fetching order intents' });
    }

    res.json({ order_intents: intents || [] });
  } catch (error) {
    console.error('Error in getUserOrderIntents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Cancel order intent (user or admin)
 */
const cancelOrderIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Get order intent
    const { data: orderIntent, error: fetchError } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !orderIntent) {
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Check permission
    if (!isAdmin && orderIntent.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only cancel INTENT_CREATED status
    if (orderIntent.status !== 'INTENT_CREATED') {
      return res.status(400).json({
        message: `Cannot cancel order intent with status: ${orderIntent.status}`
      });
    }

    // Release inventory locks
    const { data: locks } = await supabase
      .from('inventory_locks')
      .select('*')
      .eq('order_intent_id', id)
      .eq('status', 'LOCKED');

    for (const lock of locks || []) {
      // Restore stock
      await supabase.rpc('increment_stock', {
        variant_id: lock.variant_id,
        quantity: lock.quantity_locked
      });

      // Mark lock as released
      await supabase
        .from('inventory_locks')
        .update({
          status: 'RELEASED',
          released_at: new Date().toISOString()
        })
        .eq('id', lock.id);
    }

    // Release discount code
    if (orderIntent.discount_id) {
      await supabase
        .from('discounts')
        .update({
          locked_by_intent_id: null,
          locked_until: null
        })
        .eq('id', orderIntent.discount_id);
    }

    // Cancel order intent
    await supabase
      .from('order_intents')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'order_intent_cancelled',
      entity_type: 'order_intent',
      entity_id: id,
      old_values: { status: orderIntent.status },
      new_values: { status: 'CANCELLED' }
    });

    res.json({ message: 'Order intent cancelled successfully' });
  } catch (error) {
    console.error('Error in cancelOrderIntent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrderIntent,
  getOrderIntent,
  getUserOrderIntents,
  cancelOrderIntent,
};

