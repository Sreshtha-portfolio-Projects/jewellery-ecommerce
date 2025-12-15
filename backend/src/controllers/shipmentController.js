const courierService = require('../services/courierService');
const supabase = require('../config/supabase');

/**
 * Create shipment for a paid order
 */
const createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courierProvider = 'shiprocket' } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await courierService.createShipment(orderId, courierProvider);

    res.json(result);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: error.message || 'Failed to create shipment' });
  }
};

/**
 * Update tracking status
 */
const updateTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isAdmin = req.user?.role === 'admin';

    // Allow both admin and customer to check tracking
    const trackingData = await courierService.updateTracking(orderId);

    res.json(trackingData);
  } catch (error) {
    console.error('Error updating tracking:', error);
    res.status(500).json({ message: error.message || 'Failed to update tracking' });
  }
};

/**
 * Get shipment details
 */
const getShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Get order to verify access
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check access
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (shipmentError || !shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createShipment,
  updateTracking,
  getShipment
};

