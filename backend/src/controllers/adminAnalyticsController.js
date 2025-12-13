const supabase = require('../config/supabase');

const getDashboardKPIs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    // Total Orders
    let ordersQuery = supabase.from('orders').select('*', { count: 'exact', head: true });
    if (startDate && endDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
    }
    const { count: totalOrders } = await ordersQuery;

    // Orders by status
    let statusQuery = supabase.from('orders').select('status');
    if (startDate && endDate) {
      statusQuery = statusQuery.gte('created_at', startDate).lte('created_at', endDate);
    }
    const { data: ordersByStatus } = await statusQuery;

    const statusCounts = {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0
    };

    (ordersByStatus || []).forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });

    // Total Revenue (from delivered orders)
    let revenueQuery = supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered');
    
    if (startDate && endDate) {
      revenueQuery = revenueQuery.gte('created_at', startDate).lte('created_at', endDate);
    }
    
    const { data: revenueData } = await revenueQuery;
    const totalRevenue = (revenueData || []).reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    // Conversion Rate (orders / unique visitors - simplified)
    // In production, track unique visitors separately
    const conversionRate = 0; // Placeholder

    // Abandoned Cart Count (carts older than 24 hours without order)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: allCarts } = await supabase
      .from('carts')
      .select('user_id, created_at')
      .lt('created_at', oneDayAgo.toISOString());

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', oneDayAgo.toISOString());

    const usersWithRecentOrders = new Set((recentOrders || []).map(o => o.user_id));
    const abandonedCarts = (allCarts || []).filter(cart => !usersWithRecentOrders.has(cart.user_id));
    const abandonedCartCount = new Set(abandonedCarts.map(c => c.user_id)).size;

    res.json({
      totalOrders: totalOrders || 0,
      pendingOrders: statusCounts.pending,
      shippedOrders: statusCounts.shipped,
      deliveredOrders: statusCounts.delivered,
      returnedOrders: statusCounts.returned,
      totalRevenue: totalRevenue,
      conversionRate: conversionRate,
      abandonedCartCount: abandonedCartCount
    });
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({ message: 'Error fetching dashboard KPIs' });
  }
};

const getRevenueByMetalType = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get delivered orders with their items
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        created_at,
        order_items (
          product_id,
          subtotal
        )
      `)
      .eq('status', 'delivered');

    if (startDate && endDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: orders } = await ordersQuery;

    // Get product metal types
    const productIds = new Set();
    (orders || []).forEach(order => {
      (order.order_items || []).forEach(item => {
        productIds.add(item.product_id);
      });
    });

    const { data: products } = await supabase
      .from('products')
      .select('id, metal_type')
      .in('id', Array.from(productIds));

    const productMetalMap = {};
    (products || []).forEach(p => {
      productMetalMap[p.id] = p.metal_type || 'Other';
    });

    // Calculate revenue by metal type
    const revenueByMetal = {};
    (orders || []).forEach(order => {
      (order.order_items || []).forEach(item => {
        const metalType = productMetalMap[item.product_id] || 'Other';
        revenueByMetal[metalType] = (revenueByMetal[metalType] || 0) + parseFloat(item.subtotal || 0);
      });
    });

    // Format for pie chart
    const chartData = Object.entries(revenueByMetal).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching revenue by metal type:', error);
    res.status(500).json({ message: 'Error fetching revenue by metal type' });
  }
};

const getSalesComparison = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, weekly, monthly

    // Get delivered orders
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, payment_method')
      .eq('status', 'delivered')
      .order('created_at', { ascending: true });

    // Group by period
    const salesData = {};
    const onlineSales = {};
    const offlineSales = {};

    (orders || []).forEach(order => {
      const date = new Date(order.created_at);
      let key;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      salesData[key] = (salesData[key] || 0) + parseFloat(order.total_amount || 0);

      // Categorize by payment method (simplified - online vs offline)
      const isOnline = order.payment_method && 
        ['card', 'upi', 'netbanking', 'wallet'].includes(order.payment_method.toLowerCase());
      
      if (isOnline) {
        onlineSales[key] = (onlineSales[key] || 0) + parseFloat(order.total_amount || 0);
      } else {
        offlineSales[key] = (offlineSales[key] || 0) + parseFloat(order.total_amount || 0);
      }
    });

    // Format for bar chart
    const chartData = Object.keys(salesData).sort().map(key => ({
      period: key,
      online: Math.round((onlineSales[key] || 0) * 100) / 100,
      offline: Math.round((offlineSales[key] || 0) * 100) / 100,
      total: Math.round(salesData[key] * 100) / 100
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching sales comparison:', error);
    res.status(500).json({ message: 'Error fetching sales comparison' });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;

    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, metal_type, category')
      .lt('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true });

    if (error) {
      console.error('Error fetching low stock products:', error);
      return res.status(500).json({ message: 'Error fetching low stock products' });
    }

    res.json({
      threshold,
      products: data || []
    });
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardKPIs,
  getRevenueByMetalType,
  getSalesComparison,
  getLowStockProducts
};

