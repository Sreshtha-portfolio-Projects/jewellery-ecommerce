const supabase = require('../config/supabase');

/**
 * Check delivery availability and estimated delivery time by pincode
 * Now supports category and product-specific delivery times
 */
const checkDelivery = async (req, res) => {
  try {
    const { pincode, category, product_id, metal_type } = req.query;

    if (!pincode) {
      return res.status(400).json({ message: 'Pincode is required' });
    }

    // Use the database function to get the most specific match
    let query = supabase.rpc('get_delivery_info', {
      p_pincode: pincode,
      p_category: category || null,
      p_product_id: product_id || null,
      p_metal_type: metal_type || null
    });

    const { data: zoneResult, error: rpcError } = await query;

    // Fallback to simple pincode lookup if function doesn't exist or fails
    if (rpcError || !zoneResult || zoneResult.length === 0) {
      const { data: zone, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('pincode', pincode)
        .is('product_id', null)
        .is('category', null)
        .is('metal_type', null)
        .eq('is_available', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (error || !zone) {
        return res.json({
          available: false,
          message: 'Delivery not available for this pincode',
          estimatedDays: null,
          estimatedDate: null
        });
      }

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + zone.delivery_days);

      return res.json({
        available: true,
        pincode: zone.pincode,
        city: zone.city,
        state: zone.state,
        estimatedDays: zone.delivery_days,
        estimatedDate: estimatedDate.toISOString(),
        shippingCharge: parseFloat(zone.shipping_charge || 0),
        message: `Delivery in ${zone.delivery_days} business days`,
        matchType: 'pincode'
      });
    }

    const zone = zoneResult[0];

    if (!zone.is_available) {
      return res.json({
        available: false,
        message: 'Delivery temporarily unavailable for this area',
        estimatedDays: null,
        estimatedDate: null
      });
    }

    // Calculate estimated delivery date
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + zone.delivery_days);

    return res.json({
      available: true,
      pincode: zone.pincode,
      city: zone.city,
      state: zone.state,
      estimatedDays: zone.delivery_days,
      estimatedDate: estimatedDate.toISOString(),
      shippingCharge: parseFloat(zone.shipping_charge || 0),
      message: `Delivery in ${zone.delivery_days} business days`,
      matchType: zone.match_type || 'pincode'
    });
  } catch (error) {
    console.error('Error checking delivery:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkDelivery,
};

