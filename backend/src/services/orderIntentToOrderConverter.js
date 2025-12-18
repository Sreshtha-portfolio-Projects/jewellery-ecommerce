const supabase = require('../config/supabase');

/**
 * Convert order intent to order after payment confirmation
 * This function creates an actual order from an order intent
 */
const convertIntentToOrder = async (orderIntentId, paymentDetails = {}) => {
  try {
    // Get order intent with all details
    const { data: orderIntent, error: intentError } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', orderIntentId)
      .single();

    if (intentError || !orderIntent) {
      throw new Error('Order intent not found');
    }

    // Check if already converted
    if (orderIntent.status === 'CONVERTED') {
      // Get existing order
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_intent_id', orderIntentId)
        .single();
      
      if (existingOrder) {
        return existingOrder;
      }
    }

    // Check if intent is valid for conversion
    if (orderIntent.status !== 'INTENT_CREATED') {
      throw new Error(`Cannot convert order intent with status: ${orderIntent.status}`);
    }

    // Check if expired
    if (new Date(orderIntent.expires_at) < new Date()) {
      throw new Error('Order intent has expired');
    }

    // Generate order number
    let orderNumber = `ORD-${Date.now()}`;
    try {
      const { data: orderNumberData, error: rpcError } = await supabase.rpc('generate_order_number');
      if (!rpcError && orderNumberData) {
        orderNumber = Array.isArray(orderNumberData) ? orderNumberData[0] : orderNumberData;
        if (orderNumber) {
          orderNumber = String(orderNumber);
        } else {
          orderNumber = `ORD-${Date.now()}`;
        }
      }
    } catch (error) {
      console.error('Error generating order number via RPC:', error);
    }

    // Get cart snapshot items
    const cartItems = orderIntent.cart_snapshot?.items || [];

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: orderIntent.user_id,
        order_intent_id: orderIntentId,
        shipping_address_id: orderIntent.shipping_address_id,
        billing_address_id: orderIntent.billing_address_id,
        status: 'paid', // Order is created after payment confirmation
        subtotal: orderIntent.subtotal,
        discount_amount: orderIntent.discount_amount,
        shipping_cost: orderIntent.shipping_charge || 0,
        tax_amount: orderIntent.tax_amount,
        total_amount: orderIntent.total_amount,
        discount_code: orderIntent.discount_code,
        payment_status: 'paid',
        payment_method: paymentDetails.method || 'online',
        razorpay_order_id: paymentDetails.razorpay_order_id || null,
        razorpay_payment_id: paymentDetails.razorpay_payment_id || null,
        razorpay_signature: paymentDetails.razorpay_signature || null,
        is_online_order: true
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order from intent:', orderError);
      throw new Error('Failed to create order from intent');
    }

    // Create order items from cart snapshot with variant information
    const orderItemsData = cartItems.map(item => {
      const product = item.product || item.products;
      const variant = item.variant;
      const variantId = variant?.id || item.variant_id || null;
      
      // Create variant snapshot for immutable record
      const variantSnapshot = variant ? {
        size: variant.size || null,
        color: variant.color || null,
        finish: variant.finish || null,
        weight: variant.weight || null,
        sku: variant.sku || null
      } : null;
      
      // Use variant price if available, otherwise product price
      const itemPrice = variant?.price_override || variant?.price || product?.price || 0;
      
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: product?.name || 'Unknown Product',
        product_price: itemPrice,
        quantity: item.quantity,
        subtotal: itemPrice * item.quantity,
        variant_id: variantId,
        variant_snapshot: variantSnapshot
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error('Failed to create order items');
    }

    // Mark inventory locks as converted (stock already deducted during lock creation)
    const { data: locks } = await supabase
      .from('inventory_locks')
      .select('*')
      .eq('order_intent_id', orderIntentId)
      .eq('status', 'LOCKED');

    // Just mark locks as converted - stock was already deducted when order intent was created
    for (const lock of locks || []) {
      await supabase
        .from('inventory_locks')
        .update({
          status: 'CONVERTED',
          converted_at: new Date().toISOString(),
          order_id: order.id
        })
        .eq('id', lock.id);
    }

    // Update discount used count
    if (orderIntent.discount_id) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('used_count')
        .eq('id', orderIntent.discount_id)
        .single();

      if (discount) {
        await supabase
          .from('discounts')
          .update({ used_count: (discount.used_count || 0) + 1 })
          .eq('id', orderIntent.discount_id);
      }

      // Release discount lock
      await supabase
        .from('discounts')
        .update({
          locked_by_intent_id: null,
          locked_until: null
        })
        .eq('id', orderIntent.discount_id);
    }

    // Update order intent status to CONVERTED
    await supabase
      .from('order_intents')
      .update({
        status: 'CONVERTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderIntentId);

    // Clear user's cart
    await supabase.from('carts').delete().eq('user_id', orderIntent.user_id);

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: orderIntent.user_id,
        action: 'order_created_from_intent',
        entity_type: 'order',
        entity_id: order.id,
        old_values: { order_intent_id: orderIntentId, status: 'INTENT_CREATED' },
        new_values: { status: 'paid', payment_status: 'paid' }
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
      // Non-critical
    }

    return order;
  } catch (error) {
    console.error('Error converting intent to order:', error);
    throw error;
  }
};

module.exports = { convertIntentToOrder };

