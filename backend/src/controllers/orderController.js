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
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create order (pre-payment state: CREATED status, NOT_APPLICABLE payment_status)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId || shippingAddressId,
        status: 'CREATED',
        subtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        tax_amount: (subtotal - discountAmount) * 0.18, // 18% GST
        total_amount: totalAmount,
        discount_code: finalDiscountCode,
        payment_status: 'NOT_APPLICABLE',
        is_online_order: true
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ message: 'Error creating order' });
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
      return res.status(500).json({ message: 'Error creating order items' });
    }

    // Update discount used count
    if (finalDiscountCode && discount) {
      await supabase
        .from('discounts')
        .update({ used_count: discount.used_count + 1 })
        .eq('id', discount.id);
    }

    // Clear cart
    await supabase.from('carts').delete().eq('user_id', userId);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'order_created',
      entity_type: 'order',
      entity_id: order.id,
      new_values: { status: 'CREATED', payment_status: 'NOT_APPLICABLE' },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

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

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          product_price,
          subtotal
        ),
        shipping_address:addresses!shipping_address_id (*),
        billing_address:addresses!billing_address_id (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in getOrderById:', error);
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
  updateOrderStatus
};

