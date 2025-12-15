const supabase = require('../config/supabase');

/**
 * Courier Abstraction Service
 * Supports: Shiprocket, Delhivery, Blue Dart, Manual
 * Pluggable architecture - easy to add new couriers
 */

class CourierService {
  constructor() {
    this.providers = {
      shiprocket: new ShiprocketProvider(),
      delhivery: new DelhiveryProvider(),
      bluedart: new BlueDartProvider(),
      manual: new ManualProvider()
    };
  }

  /**
   * Create shipment with specified courier
   */
  async createShipment(orderId, courierProvider = 'shiprocket') {
    try {
      // Get order with address
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_address:addresses!shipping_address_id (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'paid') {
        throw new Error('Order must be paid before creating shipment');
      }

      if (order.shipment_status !== 'NOT_SHIPPED') {
        throw new Error('Shipment already created');
      }

      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      // Get provider
      const provider = this.providers[courierProvider.toLowerCase()];
      if (!provider) {
        throw new Error(`Courier provider ${courierProvider} not supported`);
      }

      // Create shipment via provider
      const shipmentResult = await provider.createShipment({
        order,
        orderItems,
        address: order.shipping_address
      });

      // Save shipment record
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          courier_provider: courierProvider.toLowerCase(),
          courier_name: shipmentResult.courierName,
          tracking_number: shipmentResult.trackingNumber,
          awb_number: shipmentResult.awbNumber,
          status: 'SHIPPED',
          estimated_delivery_date: shipmentResult.estimatedDelivery,
          courier_response: shipmentResult.rawResponse
        })
        .select()
        .single();

      if (shipmentError) {
        throw new Error('Failed to save shipment record');
      }

      // Update order
      await supabase
        .from('orders')
        .update({
          courier_name: shipmentResult.courierName,
          tracking_number: shipmentResult.trackingNumber,
          shipment_status: 'SHIPPED',
          shipment_created_at: new Date().toISOString(),
          status: 'shipped'
        })
        .eq('id', orderId);

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: order.user_id,
        action: 'shipment_created',
        entity_type: 'order',
        entity_id: orderId,
        new_values: {
          courier_provider: courierProvider,
          tracking_number: shipmentResult.trackingNumber
        }
      });

      return {
        success: true,
        shipment,
        trackingNumber: shipmentResult.trackingNumber,
        courierName: shipmentResult.courierName
      };
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }

  /**
   * Update tracking status (can be called via webhook or polling)
   */
  async updateTracking(orderId) {
    try {
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const provider = this.providers[shipment.courier_provider];
      if (!provider) {
        throw new Error(`Provider ${shipment.courier_provider} not found`);
      }

      const trackingData = await provider.getTracking(shipment.tracking_number);

      // Update shipment
      await supabase
        .from('shipments')
        .update({
          status: trackingData.status,
          current_location: trackingData.currentLocation,
          tracking_events: trackingData.events,
          actual_delivery_date: trackingData.deliveredAt || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipment.id);

      // Update order shipment status
      await supabase
        .from('orders')
        .update({
          shipment_status: trackingData.status,
          shipment_updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Update order status if delivered
      if (trackingData.status === 'DELIVERED') {
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', orderId);
      }

      return trackingData;
    } catch (error) {
      console.error('Error updating tracking:', error);
      throw error;
    }
  }
}

/**
 * Shiprocket Provider
 */
class ShiprocketProvider {
  async createShipment({ order, orderItems, address }) {
    // TODO: Implement actual Shiprocket API integration
    // For now, return mock data
    const trackingNumber = `SR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      courierName: 'Shiprocket',
      trackingNumber,
      awbNumber: trackingNumber,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      rawResponse: { mock: true, provider: 'shiprocket' }
    };
  }

  async getTracking(trackingNumber) {
    // TODO: Implement actual tracking API
    return {
      status: 'IN_TRANSIT',
      currentLocation: 'Mumbai Hub',
      events: [
        { timestamp: new Date().toISOString(), status: 'SHIPPED', location: 'Origin' },
        { timestamp: new Date().toISOString(), status: 'IN_TRANSIT', location: 'Mumbai Hub' }
      ],
      deliveredAt: null
    };
  }
}

/**
 * Delhivery Provider
 */
class DelhiveryProvider {
  async createShipment({ order, orderItems, address }) {
    const trackingNumber = `DL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      courierName: 'Delhivery',
      trackingNumber,
      awbNumber: trackingNumber,
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      rawResponse: { mock: true, provider: 'delhivery' }
    };
  }

  async getTracking(trackingNumber) {
    return {
      status: 'IN_TRANSIT',
      currentLocation: 'Delhi Hub',
      events: [
        { timestamp: new Date().toISOString(), status: 'SHIPPED', location: 'Origin' },
        { timestamp: new Date().toISOString(), status: 'IN_TRANSIT', location: 'Delhi Hub' }
      ],
      deliveredAt: null
    };
  }
}

/**
 * Blue Dart Provider
 */
class BlueDartProvider {
  async createShipment({ order, orderItems, address }) {
    const trackingNumber = `BD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      courierName: 'Blue Dart',
      trackingNumber,
      awbNumber: trackingNumber,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      rawResponse: { mock: true, provider: 'bluedart' }
    };
  }

  async getTracking(trackingNumber) {
    return {
      status: 'IN_TRANSIT',
      currentLocation: 'Bangalore Hub',
      events: [
        { timestamp: new Date().toISOString(), status: 'SHIPPED', location: 'Origin' },
        { timestamp: new Date().toISOString(), status: 'IN_TRANSIT', location: 'Bangalore Hub' }
      ],
      deliveredAt: null
    };
  }
}

/**
 * Manual Provider (for manual shipping)
 */
class ManualProvider {
  async createShipment({ order, orderItems, address }) {
    // Manual provider - admin enters tracking details
    return {
      courierName: 'Manual',
      trackingNumber: `MANUAL-${order.order_number}`,
      awbNumber: null,
      estimatedDelivery: null,
      rawResponse: { manual: true }
    };
  }

  async getTracking(trackingNumber) {
    // Manual tracking - status updated by admin
    return {
      status: 'SHIPPED',
      currentLocation: 'Manual Entry',
      events: [],
      deliveredAt: null
    };
  }
}

module.exports = new CourierService();

