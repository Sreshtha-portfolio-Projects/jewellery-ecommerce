const supabase = require('../config/supabase');

// Valid order state transitions
const VALID_TRANSITIONS = {
  CREATED: ['paid', 'cancelled', 'shipped'], // CREATED orders can be paid, cancelled, or directly shipped
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  cancelled: []
};

const validateTransition = (fromStatus, toStatus) => {
  const allowed = VALID_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId, billingAddressId, discountCode } = req.body;

    // Get user's cart
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

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      if (!item.products) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }

      // Check if product has variants
      let availableStock = item.products.stock_quantity;
      
      try {
        const { data: variants, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity, is_active')
          .eq('product_id', item.product_id)
          .eq('is_active', true);

        if (variantError) {
          console.error('Error checking variants:', variantError);
          // Continue with product stock if variant check fails
        } else if (variants && variants.length > 0) {
          // Product has variants - use total available variant stock
          // Note: Since carts table doesn't have variant_id, we can't check specific variant
          // So we use the sum of all active variant stock as a conservative estimate
          availableStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        }
      } catch (error) {
        console.error('Error checking variants for product:', item.product_id, error);
        // Continue with product stock if variant check fails
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.products.name}. Only ${availableStock} available.` 
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

    // Validate discount code if provided
    let discountAmount = 0;
    let finalDiscountCode = null;

    if (discountCode) {
      const { data: discount, error: discountError } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!discountError && discount) {
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
      } else {
        return res.status(400).json({ message: 'Invalid discount code' });
      }
    }

    // Calculate totals (BACKEND ONLY)
    const shippingCost = 0; // Free shipping for now
    const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
    const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;
    
    // Ensure total is never negative
    if (totalAmount < 0) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    // Generate order number
    let orderNumber = `ORD-${Date.now()}`;
    try {
      const { data: orderNumberData, error: rpcError } = await supabase.rpc('generate_order_number');
      if (!rpcError && orderNumberData) {
        // RPC might return the value directly or in an array
        orderNumber = Array.isArray(orderNumberData) ? orderNumberData[0] : orderNumberData;
        // Ensure it's a string
        if (orderNumber) {
          orderNumber = String(orderNumber);
        } else {
          orderNumber = `ORD-${Date.now()}`;
        }
      }
    } catch (error) {
      console.error('Error generating order number via RPC:', error);
      // Use fallback order number
    }

    // Create order (pre-payment state: pending status, pending payment_status)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId || shippingAddressId,
        status: 'pending', // Valid status per database constraint
        subtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        tax_amount: (subtotal - discountAmount) * 0.18, // 18% GST
        total_amount: totalAmount,
        discount_code: finalDiscountCode,
        payment_status: 'pending', // Use 'pending' instead of 'NOT_APPLICABLE'
        is_online_order: true
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Error creating order' 
        : orderError.message || 'Error creating order';
      return res.status(500).json({ 
        message: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? orderError : undefined
      });
    }

    // Create order items
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
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Error creating order items' 
        : itemsError.message || 'Error creating order items';
      return res.status(500).json({ 
        message: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? itemsError : undefined
      });
    }

    // Update discount used count
    if (finalDiscountCode && discount) {
      await supabase
        .from('discounts')
        .update({ used_count: discount.used_count + 1 })
        .eq('id', discount.id);
    }

    // Clear cart
    const { error: cartClearError } = await supabase.from('carts').delete().eq('user_id', userId);
    if (cartClearError) {
      console.error('Error clearing cart:', cartClearError);
      // Non-critical, don't fail the order
    }

    // Log audit (non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'order_created',
        entity_type: 'order',
        entity_id: order.id,
        new_values: { status: 'pending', payment_status: 'pending' },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
      // Non-critical, don't fail the order
    }

    // Note: Stock deduction and payment processing will be handled when payment integration is added
    // Orders are now created as intent/enquiry/pre-order

    res.status(201).json(order);
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          product_price,
          subtotal
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Error fetching orders' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get order with all related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          product_price,
          subtotal,
          variant_id,
          variant_snapshot
        ),
        shipping_address:addresses!shipping_address_id (*),
        billing_address:addresses!billing_address_id (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get product images for order items
    const productIds = (order.order_items || []).map(item => item.product_id).filter(Boolean);
    let productMap = {};
    
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, image_url, name')
        .in('id', productIds);

      (products || []).forEach(p => {
        productMap[p.id] = p;
      });
    }

    // Enrich order items with product images and variant info
    const enrichedItems = (order.order_items || []).map(item => ({
      ...item,
      product_image: productMap[item.product_id]?.image_url || null,
      variant_info: item.variant_snapshot ? {
        size: item.variant_snapshot.size,
        color: item.variant_snapshot.color,
        finish: item.variant_snapshot.finish,
        weight: item.variant_snapshot.weight
      } : null
    }));

    // Calculate order status timeline (with payment status)
    const timeline = getOrderStatusTimeline(
      order.status || 'pending', 
      order.shipment_status || 'NOT_SHIPPED', 
      order.payment_status || 'pending', 
      order.created_at, 
      order.shipment_updated_at
    );

    // Calculate estimated delivery date
    const estimatedDelivery = calculateEstimatedDelivery(
      order.created_at, 
      order.status || 'pending', 
      order.shipment_status || 'NOT_SHIPPED'
    );

    // Format payment details
    const paymentDetails = {
      status: order.payment_status || 'pending',
      method: order.payment_method || 'online',
      payment_id: order.razorpay_payment_id && order.razorpay_payment_id.length >= 8 
        ? order.razorpay_payment_id.substring(0, 8) + '****' 
        : (order.razorpay_payment_id || null),
      order_id: order.razorpay_order_id || null,
      paid_at: order.payment_status === 'paid' ? order.created_at : null,
      amount: parseFloat(order.total_amount || 0)
    };

    // Format shipping details
    const shippingDetails = {
      status: order.shipment_status || 'NOT_SHIPPED',
      courier_name: order.courier_name || null,
      tracking_number: order.tracking_number || null,
      shipped_at: order.shipment_created_at || null,
      last_updated: order.shipment_updated_at || null,
      estimated_delivery: estimatedDelivery
    };

    // Format response
    const orderDetail = {
      order: {
        id: order.id,
        order_number: order.order_number || `ORD-${order.id?.slice(0, 8) || 'UNKNOWN'}`,
        status: order.status || 'pending',
        created_at: order.created_at,
        updated_at: order.updated_at,
        subtotal: parseFloat(order.subtotal || 0) || 0,
        discount_amount: parseFloat(order.discount_amount || 0) || 0,
        tax_amount: parseFloat(order.tax_amount || 0) || 0,
        shipping_cost: parseFloat(order.shipping_cost || 0) || 0,
        total_amount: parseFloat(order.total_amount || 0) || 0,
        discount_code: order.discount_code || null,
        notes: order.notes || null
      },
      items: enrichedItems,
      order_items: enrichedItems, // Also include for backward compatibility
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      payment: paymentDetails,
      shipping: shippingDetails,
      timeline,
      estimated_delivery: estimatedDelivery
    };

    res.json(orderDetail);
  } catch (error) {
    console.error('Error in getOrderById:', error);
    console.error('Error stack:', error.stack);
    console.error('Order ID:', req.params.id);
    console.error('User ID:', req.user?.userId);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal server error'
      : 'Internal server error';
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get order confirmation details
 * GET /api/orders/:orderId/confirmation
 */
const getOrderConfirmation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: orderId } = req.params;

    // Get order with all related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          subtotal,
          variant_id,
          variant_snapshot
        ),
        shipping_address:addresses!shipping_address_id (*),
        billing_address:addresses!billing_address_id (*)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get product images for order items
    const productIds = (order.order_items || []).map(item => item.product_id).filter(Boolean);
    let productMap = {};
    
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, image_url, name')
        .in('id', productIds);

      (products || []).forEach(p => {
        productMap[p.id] = p;
      });
    }

    // Enrich order items with product images
    const enrichedItems = order.order_items.map(item => ({
      ...item,
      product_image: productMap[item.product_id]?.image_url || null,
      product_name: item.product_name,
      variant_info: item.variant_snapshot ? {
        size: item.variant_snapshot.size,
        color: item.variant_snapshot.color,
        finish: item.variant_snapshot.finish,
        weight: item.variant_snapshot.weight
      } : null
    }));

    // Calculate order status timeline (for confirmation page - simpler version)
    const timeline = getOrderStatusTimeline(
      order.status, 
      order.shipment_status, 
      order.payment_status, 
      order.created_at, 
      order.shipment_updated_at
    );

    // Calculate estimated delivery date
    const estimatedDelivery = calculateEstimatedDelivery(order.created_at, order.status, order.shipment_status);

    // Format response
    const confirmationData = {
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method || 'online',
        created_at: order.created_at,
        subtotal: parseFloat(order.subtotal),
        discount_amount: parseFloat(order.discount_amount || 0),
        tax_amount: parseFloat(order.tax_amount || 0),
        shipping_cost: parseFloat(order.shipping_cost || 0),
        total_amount: parseFloat(order.total_amount)
      },
      items: enrichedItems,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      timeline,
      estimated_delivery: estimatedDelivery
    };

    res.json(confirmationData);
  } catch (error) {
    console.error('Error in getOrderConfirmation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get order status timeline based on current status
 * Enhanced version with payment status and timestamps
 */
const getOrderStatusTimeline = (orderStatus, shipmentStatus, paymentStatus, orderCreatedAt, shipmentUpdatedAt) => {
  const statuses = [
    { key: 'placed', label: 'Order Placed', completed: true, inProgress: false, timestamp: orderCreatedAt },
    { key: 'payment', label: 'Payment Successful', completed: false, inProgress: false, timestamp: null },
    { key: 'processing', label: 'Processing', completed: false, inProgress: false, timestamp: null },
    { key: 'shipped', label: 'Shipped', completed: false, inProgress: false, timestamp: null },
    { key: 'out_for_delivery', label: 'Out for Delivery', completed: false, inProgress: false, timestamp: null },
    { key: 'delivered', label: 'Delivered', completed: false, inProgress: false, timestamp: null }
  ];

  // Order Placed is always completed
  statuses[0].completed = true;
  statuses[0].timestamp = orderCreatedAt;

  // Payment status
  if (paymentStatus === 'paid' || orderStatus === 'paid') {
    statuses[1].completed = true;
    statuses[1].timestamp = orderCreatedAt; // Payment happens at order creation for online orders
  }

  // Map order status to timeline
  if (orderStatus === 'paid' || orderStatus === 'pending' || orderStatus === 'PAYMENT_PENDING') {
    // Order is paid/pending - processing
    if (paymentStatus === 'paid') {
      statuses[1].completed = true;
    }
    statuses[2].inProgress = true;
  } else if (orderStatus === 'shipped' || shipmentStatus === 'SHIPPED') {
    // Order is shipped
    statuses[1].completed = true;
    statuses[2].completed = true;
    statuses[2].inProgress = false;
    statuses[3].completed = true;
    statuses[3].inProgress = true;
    statuses[3].timestamp = shipmentUpdatedAt || orderCreatedAt;
  } else if (shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'OUT_FOR_DELIVERY') {
    // Order is out for delivery
    statuses[1].completed = true;
    statuses[2].completed = true;
    statuses[2].inProgress = false;
    statuses[3].completed = true;
    statuses[3].inProgress = false;
    statuses[4].completed = true;
    statuses[4].inProgress = true;
    statuses[4].timestamp = shipmentUpdatedAt || orderCreatedAt;
  } else if (orderStatus === 'delivered' || shipmentStatus === 'DELIVERED') {
    // Order is delivered - all completed
    statuses.forEach(s => {
      s.completed = true;
      s.inProgress = false;
    });
    statuses[5].timestamp = shipmentUpdatedAt || orderCreatedAt;
  } else {
    // Default: just placed, processing
    if (paymentStatus === 'paid') {
      statuses[1].completed = true;
    }
    statuses[2].inProgress = true;
  }

  return statuses;
};

/**
 * Calculate estimated delivery date
 */
const calculateEstimatedDelivery = (orderCreatedAt, orderStatus, shipmentStatus) => {
  // Default: 3-5 business days from order creation
  if (!orderCreatedAt) {
    return {
      min_date: null,
      max_date: null,
      display: 'Delivery date will be updated soon',
      available: false
    };
  }
  
  const orderDate = new Date(orderCreatedAt);
  if (isNaN(orderDate.getTime())) {
    return {
      min_date: null,
      max_date: null,
      display: 'Delivery date will be updated soon',
      available: false
    };
  }
  
  const minDays = 3;
  const maxDays = 5;

  // Add business days (excluding weekends)
  const addBusinessDays = (date, days) => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        added++;
      }
    }
    return result;
  };

  // If order is already shipped or in transit, adjust estimate
  if (orderStatus === 'shipped' || shipmentStatus === 'SHIPPED' || shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'OUT_FOR_DELIVERY') {
    // If shipped, reduce estimate to 1-3 business days
    const shippedMin = addBusinessDays(orderDate, 1);
    const shippedMax = addBusinessDays(orderDate, 3);
    return {
      min_date: shippedMin.toISOString(),
      max_date: shippedMax.toISOString(),
      display: `${formatDate(shippedMin)} - ${formatDate(shippedMax)}`,
      available: true
    };
  }

  // If delivered, show actual delivery date
  if (orderStatus === 'delivered' || shipmentStatus === 'DELIVERED') {
    return {
      min_date: orderDate.toISOString(),
      max_date: orderDate.toISOString(),
      display: 'Delivered',
      available: true,
      delivered: true
    };
  }

  // Default: 3-5 business days
  const minDate = addBusinessDays(orderDate, minDays);
  const maxDate = addBusinessDays(orderDate, maxDays);

  return {
    min_date: minDate.toISOString(),
    max_date: maxDate.toISOString(),
    display: `${formatDate(minDate)} - ${formatDate(maxDate)}`,
    available: true
  };
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) {
    return '';
  }
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Get invoice data for order
 * GET /api/orders/:orderId/invoice
 */
const getOrderInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: orderId } = req.params;

    // Get order with all details (reuse getOrderById logic)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          subtotal,
          variant_snapshot
        ),
        shipping_address:addresses!shipping_address_id (*),
        billing_address:addresses!billing_address_id (*)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment is successful (invoice only available after payment)
    if (order.payment_status !== 'paid') {
      return res.status(400).json({ 
        message: 'Invoice is only available for paid orders' 
      });
    }

    // Format invoice data
    const invoiceData = {
      invoice_number: `INV-${order.order_number}`,
      order_number: order.order_number,
      invoice_date: new Date().toISOString(),
      order_date: order.created_at,
      seller: {
        name: 'Aldorado Jewells',
        address: 'Your Business Address',
        gstin: 'GSTIN Number', // Add to admin settings later
        phone: 'Customer Support Number',
        email: 'support@aldoradojewells.com'
      },
      buyer: {
        name: order.shipping_address?.full_name || 'Customer',
        address: order.shipping_address ? [
          order.shipping_address.address_line1,
          order.shipping_address.address_line2,
          `${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`
        ].filter(Boolean).join(', ') : 'N/A',
        phone: order.shipping_address?.phone || 'N/A'
      },
      items: order.order_items.map(item => ({
        name: item.product_name,
        variant: item.variant_snapshot ? 
          [item.variant_snapshot.size, item.variant_snapshot.color, item.variant_snapshot.finish]
            .filter(Boolean).join(', ') : null,
        quantity: item.quantity,
        unit_price: parseFloat(item.product_price),
        total: parseFloat(item.subtotal)
      })),
      pricing: {
        subtotal: parseFloat(order.subtotal),
        discount_amount: parseFloat(order.discount_amount || 0),
        discount_code: order.discount_code || null,
        tax_amount: parseFloat(order.tax_amount || 0),
        shipping_cost: parseFloat(order.shipping_cost || 0),
        total_amount: parseFloat(order.total_amount)
      },
      payment: {
        method: order.payment_method || 'Online',
        transaction_id: order.razorpay_payment_id ? order.razorpay_payment_id.substring(0, 8) + '****' : null,
        paid_at: order.created_at
      }
    };

    res.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can update order status
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Validate status transition
    if (!validateTransition(order.status, status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${order.status} to ${status}` 
      });
    }

    // Handle stock management based on status
    if (status === 'paid' && order.status === 'pending') {
      // Deduct stock when order is paid
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id);

      for (const item of orderItems || []) {
        // Get current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }
    } else if (status === 'cancelled' && order.status === 'paid') {
      // Restore stock if cancelling a paid order
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id);

      for (const item of orderItems || []) {
        // Get current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    // Update order status
    const updateData = { status };
    if (notes) updateData.notes = notes;

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({ message: 'Error updating order' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'order_updated',
      entity_type: 'order',
      entity_id: id,
      old_values: { status: order.status },
      new_values: { status: status },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderConfirmation,
  getOrderInvoice,
  updateOrderStatus
};

