const supabase = require('../config/supabase');
const pricingEngine = require('../services/pricingEngine');

/**
 * Track cart activity
 */
const trackCartActivity = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'] || req.ip;

    // Get user's cart
    const { data: cartItems } = await supabase
      .from('carts')
      .select(`
        quantity,
        product:products(price, base_price),
        variant:product_variants(price_override, base_price)
      `)
      .eq('user_id', userId);

    if (!cartItems || cartItems.length === 0) {
      return res.json({ tracked: false, message: 'Cart is empty' });
    }

    // Calculate cart value
    let cartValue = 0;
    let itemCount = 0;

    cartItems.forEach(item => {
      const price = item.variant?.price_override 
        || item.variant?.base_price 
        || item.product?.base_price 
        || item.product?.price 
        || 0;
      cartValue += price * item.quantity;
      itemCount += item.quantity;
    });

    // Update or create abandoned cart record
    const { data: existing } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('abandoned_carts')
        .update({
          cart_value: cartValue,
          item_count: itemCount,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('abandoned_carts')
        .insert({
          user_id: userId,
          session_id: sessionId,
          cart_value: cartValue,
          item_count: itemCount,
          status: 'ACTIVE',
          last_activity_at: new Date().toISOString()
        });
    }

    res.json({ tracked: true });
  } catch (error) {
    console.error('Error tracking cart activity:', error);
    res.json({ tracked: false });
  }
};

/**
 * Get abandoned carts (admin)
 */
const getAbandonedCarts = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = supabase
      .from('abandoned_carts')
      .select(`
        *,
        user:auth.users(email, raw_user_meta_data)
      `)
      .order('last_activity_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: carts, error } = await query;

    if (error) {
      console.error('Error fetching abandoned carts:', error);
      return res.status(500).json({ message: 'Error fetching abandoned carts' });
    }

    res.json({ abandoned_carts: carts || [] });
  } catch (error) {
    console.error('Error in getAbandonedCarts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get abandoned cart statistics
 */
const getAbandonedCartStats = async (req, res) => {
  try {
    // Get timeout setting
    const timeoutMinutes = await pricingEngine.getSetting('abandoned_cart_timeout_minutes', 60);
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    // Get abandoned carts
    const { data: abandoned } = await supabase
      .from('abandoned_carts')
      .select('cart_value, status')
      .eq('status', 'ABANDONED');

    // Get active carts
    const { data: active } = await supabase
      .from('abandoned_carts')
      .select('cart_value')
      .eq('status', 'ACTIVE')
      .lt('last_activity_at', cutoffTime.toISOString());

    const totalAbandoned = (abandoned || []).length;
    const totalActive = (active || []).length;
    const totalCarts = totalAbandoned + totalActive;

    const abandonedValue = (abandoned || []).reduce((sum, c) => sum + parseFloat(c.cart_value || 0), 0);
    const activeValue = (active || []).reduce((sum, c) => sum + parseFloat(c.cart_value || 0), 0);

    const abandonmentRate = totalCarts > 0 
      ? ((totalAbandoned / totalCarts) * 100).toFixed(2)
      : 0;

    res.json({
      total_abandoned: totalAbandoned,
      total_active: totalActive,
      abandoned_value: abandonedValue,
      active_value: activeValue,
      abandonment_rate: parseFloat(abandonmentRate),
      timeout_minutes: timeoutMinutes
    });
  } catch (error) {
    console.error('Error in getAbandonedCartStats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  trackCartActivity,
  getAbandonedCarts,
  getAbandonedCartStats,
};

