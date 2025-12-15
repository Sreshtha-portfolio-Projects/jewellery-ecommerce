const supabase = require('../config/supabase');

const getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        total_amount,
        user_id
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Error fetching orders' });
    }

    // Get order items for each order
    const orderIds = (data || []).map(o => o.id);
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id, product_name, quantity, product_price')
      .in('order_id', orderIds);

    // Get user emails
    const userIds = [...new Set((data || []).map(o => o.user_id))];
    const { data: users } = await supabase.auth.admin.listUsers();
    const userMap = {};
    (users?.users || []).forEach(u => {
      userMap[u.id] = u.email;
    });

    const itemsByOrder = {};
    (orderItems || []).forEach(item => {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }
      itemsByOrder[item.order_id].push(item);
    });

    const ordersWithItems = (data || []).map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      customerName: userMap[order.user_id] || 'N/A'
    }));

    res.json({
      orders: ordersWithItems,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
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
      .single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get status history
    const { data: statusHistory } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
    const customerEmail = userData?.user?.email || 'N/A';

    res.json({
      ...order,
      customerEmail,
      statusHistory: statusHistory || []
    });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderDetails
};

