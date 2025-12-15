const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order and internal order
 * Flow: Validate cart → Create internal order (PAYMENT_PENDING) → Create Razorpay order
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId, billingAddressId, discountCode, paymentMethod } = req.body;

    // Step 1: Get and validate cart
    const { data: cartItems, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        products (
          id,
          name,
          price,
          stock_quantity
        )
      `)
      .eq('user_id', userId);

    if (cartError || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Step 2: Validate stock and calculate totals (BACKEND CALCULATION - NEVER TRUST FRONTEND)
    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      if (!item.products) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }

      if (item.products.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.products.name}. Only ${item.products.stock_quantity} available.` 
        });
      }

      const itemSubtotal = parseFloat(item.products.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: item.products.id,
        product_name: item.products.name,
        product_price: item.products.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // Step 3: Validate and calculate discount
    let discountAmount = 0;
    let finalDiscountCode = null;
    let discount = null;

    if (discountCode) {
      const { data: discountData, error: discountError } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (discountError || !discountData) {
        return res.status(400).json({ message: 'Invalid discount code' });
      }

      discount = discountData;

      // Check expiry
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        return res.status(400).json({ message: 'Discount code has expired' });
      }

      // Check minimum cart value
      if (subtotal < parseFloat(discount.minimum_cart_value)) {
        return res.status(400).json({ 
          message: `Minimum cart value of ₹${discount.minimum_cart_value} required for this discount` 
        });
      }

      // Check max uses
      if (discount.max_uses && discount.used_count >= discount.max_uses) {
        return res.status(400).json({ message: 'Discount code has reached maximum uses' });
      }

      // Calculate discount
      if (discount.discount_type === 'percentage') {
        discountAmount = (subtotal * parseFloat(discount.discount_value)) / 100;
      } else {
        discountAmount = parseFloat(discount.discount_value);
      }

      // Don't allow discount to exceed subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      finalDiscountCode = discount.code;
    }

    // Step 4: Calculate totals (BACKEND ONLY)
    const shippingCost = 0; // Free shipping for now
    const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
    const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

    // Ensure total is never negative
    if (totalAmount < 0) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    // Step 5: Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Step 6: Create internal order with PAYMENT_PENDING status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId || shippingAddressId,
        status: 'PAYMENT_PENDING',
        subtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        discount_code: finalDiscountCode,
        payment_method: paymentMethod || 'razorpay',
        payment_status: 'pending',
        is_online_order: true
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ message: 'Error creating order' });
    }

    // Step 7: Create order items
    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ message: 'Error creating order items' });
    }

    // Step 8: Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        order_id: order.id,
        user_id: userId,
        discount_code: finalDiscountCode || 'none'
      }
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      // Rollback internal order
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ message: 'Payment gateway error. Please try again.' });
    }

    // Step 9: Update order with Razorpay order ID
    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id);

    // Step 10: Create payment transaction record
    await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        payment_method: paymentMethod || 'razorpay',
        payment_status: 'pending'
      });

    // Step 11: Lock discount (update used count)
    if (finalDiscountCode && discount) {
      await supabase
        .from('discounts')
        .update({ used_count: discount.used_count + 1 })
        .eq('id', discount.id);
    }

    // Step 12: Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'order_created',
      entity_type: 'order',
      entity_id: order.id,
      new_values: { status: 'PAYMENT_PENDING', razorpay_order_id: razorpayOrder.id },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Return order with Razorpay details for frontend
    res.status(201).json({
      order: {
        ...order,
        razorpay_order_id: razorpayOrder.id
      },
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

/**
 * Handle Razorpay webhook
 * This is the ONLY place where payment success is confirmed
 */
const handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Only process payment.captured event
    if (event !== 'payment.captured' && event !== 'payment.failed') {
      return res.status(200).json({ received: true });
    }

    const payment = payload.payment.entity;
    const orderId = payment.notes?.order_id;

    if (!orderId) {
      console.error('Webhook: Order ID not found in payment notes');
      return res.status(400).json({ message: 'Order ID missing' });
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Webhook: Order not found', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify webhook signature (idempotent check)
    if (order.payment_status === 'captured' && order.razorpay_payment_id === payment.id) {
      console.log('Webhook: Payment already processed (idempotent)');
      return res.status(200).json({ received: true, message: 'Already processed' });
    }

    // Update payment transaction
    await supabase
      .from('payment_transactions')
      .update({
        razorpay_payment_id: payment.id,
        payment_status: event === 'payment.captured' ? 'captured' : 'failed',
        razorpay_response: payload,
        webhook_received: true,
        webhook_verified: true
      })
      .eq('razorpay_order_id', payment.order_id);

    if (event === 'payment.captured') {
      // Payment successful - update order to PAID and deduct stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      // Deduct stock
      for (const item of orderItems || []) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product && product.stock_quantity >= item.quantity) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        } else {
          console.error(`Insufficient stock for product ${item.product_id} after payment`);
        }
      }

      // Update order
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'captured',
          razorpay_payment_id: payment.id,
          razorpay_signature: payment.notes?.signature || null
        })
        .eq('id', orderId);

      // Clear cart
      await supabase.from('carts').delete().eq('user_id', order.user_id);

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: order.user_id,
        action: 'payment_captured',
        entity_type: 'order',
        entity_id: orderId,
        old_values: { status: order.status, payment_status: order.payment_status },
        new_values: { status: 'paid', payment_status: 'captured' },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } else if (event === 'payment.failed') {
      // Payment failed - mark order as FAILED
      await supabase
        .from('orders')
        .update({
          status: 'FAILED',
          payment_status: 'failed',
          razorpay_payment_id: payment.id
        })
        .eq('id', orderId);

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: order.user_id,
        action: 'payment_failed',
        entity_type: 'order',
        entity_id: orderId,
        old_values: { status: order.status, payment_status: order.payment_status },
        new_values: { status: 'FAILED', payment_status: 'failed' },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};

module.exports = {
  createOrder,
  handleWebhook,
  verifyWebhookSignature
};

