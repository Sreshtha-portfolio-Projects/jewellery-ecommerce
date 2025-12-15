const supabase = require('../config/supabase');

/**
 * Check delivery availability and estimated delivery time by pincode
 */
const checkDelivery = async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      return res.status(400).json({ message: 'Pincode is required' });
    }

    // Check if pincode exists in delivery zones
    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('pincode', pincode)
      .single();

    if (error || !zone) {
      return res.json({
        available: false,
        message: 'Delivery not available for this pincode',
        estimatedDays: null,
        estimatedDate: null
      });
    }

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
      message: `Delivery in ${zone.delivery_days} business days`
    });
  } catch (error) {
    console.error('Error checking delivery:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkDelivery,
};

