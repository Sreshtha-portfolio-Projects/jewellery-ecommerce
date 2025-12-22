const supabase = require('../config/supabase');

// Valid shipping state transitions (strict sequential)
const SHIPPING_STATE_MACHINE = {
  NOT_SHIPPED: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  RETURNED: [] // Terminal state
};

/**
 * Validate shipping status transition
 */
const validateShippingTransition = (fromStatus, toStatus) => {
  if (!fromStatus) {
    fromStatus = 'NOT_SHIPPED';
  }
  
  const allowed = SHIPPING_STATE_MACHINE[fromStatus] || [];
  return allowed.includes(toStatus);
};

/**
 * Get next valid shipping status
 */
const getNextValidStatus = (currentStatus) => {
  if (!currentStatus) {
    currentStatus = 'NOT_SHIPPED';
  }
  return SHIPPING_STATE_MACHINE[currentStatus] || [];
};

/**
 * Update shipping status
 * POST /api/admin/orders/:id/shipping/status
 */
const updateShippingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.userId;

    if (!status) {
      return res.status(400).json({ message: 'Shipping status is required' });
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('shipment_status, payment_status, status')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is paid (required for shipping)
    if (order.payment_status !== 'paid' && order.status !== 'paid') {
      return res.status(400).json({ 
        message: 'Order must be paid before shipping can be updated' 
      });
    }

    const currentStatus = order.shipment_status || 'NOT_SHIPPED';

    // Validate transition
    if (!validateShippingTransition(currentStatus, status)) {
      const nextValid = getNextValidStatus(currentStatus);
      return res.status(400).json({ 
        message: `Invalid status transition. Current status: ${currentStatus}. Valid next status: ${nextValid.join(', ') || 'none'}`,
        currentStatus,
        validNextStatuses: nextValid
      });
    }

    // Update shipping status
    const updateData = {
      shipment_status: status,
      shipment_updated_at: new Date().toISOString()
    };

    // Set shipment_created_at when first shipping
    if (status === 'SHIPPED' && currentStatus !== 'SHIPPED') {
      updateData.shipment_created_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shipping status:', updateError);
      return res.status(500).json({ message: 'Error updating shipping status' });
    }

    // Log status change with admin ID
    const { error: historyError } = await supabase
      .from('shipping_status_history')
      .insert({
        order_id: id,
        from_status: currentStatus,
        to_status: status,
        updated_by: adminId,
        notes: notes || null,
        courier_name: updatedOrder.courier_name || null,
        tracking_number: updatedOrder.tracking_number || null
      });

    if (historyError) {
      console.error('Error logging shipping status history:', historyError);
      // Non-critical, don't fail the request
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'shipping_status_updated',
        entity_type: 'order',
        entity_id: id,
        old_values: { shipment_status: currentStatus },
        new_values: { shipment_status: status, notes: notes || null },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
      // Non-critical
    }

    res.json({
      message: 'Shipping status updated successfully',
      order: updatedOrder,
      previousStatus: currentStatus,
      newStatus: status
    });
  } catch (error) {
    console.error('Error in updateShippingStatus:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create shipment (add courier and tracking info)
 * POST /api/admin/orders/:id/shipping/create
 */
const createShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number, notes } = req.body;
    const adminId = req.user.userId;

    if (!courier_name || !tracking_number) {
      return res.status(400).json({ 
        message: 'Courier name and tracking number are required' 
      });
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('shipment_status, payment_status, status')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is paid
    if (order.payment_status !== 'paid' && order.status !== 'paid') {
      return res.status(400).json({ 
        message: 'Order must be paid before creating shipment' 
      });
    }

    const currentStatus = order.shipment_status || 'NOT_SHIPPED';

    // Can only create shipment from NOT_SHIPPED or PROCESSING
    if (currentStatus !== 'NOT_SHIPPED' && currentStatus !== 'PROCESSING') {
      return res.status(400).json({ 
        message: `Cannot create shipment. Current status: ${currentStatus}. Shipment can only be created from NOT_SHIPPED or PROCESSING.` 
      });
    }

    // Update order with shipment info and set status to SHIPPED
    const updateData = {
      courier_name,
      tracking_number,
      shipment_status: 'SHIPPED',
      shipment_created_at: new Date().toISOString(),
      shipment_updated_at: new Date().toISOString(),
      shipping_notes: notes || null
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error creating shipment:', updateError);
      console.error('Update error details:', JSON.stringify(updateError, null, 2));
      return res.status(500).json({ 
        message: 'Error creating shipment',
        error: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    // Log status change
    const { error: historyError } = await supabase
      .from('shipping_status_history')
      .insert({
        order_id: id,
        from_status: currentStatus,
        to_status: 'SHIPPED',
        updated_by: adminId,
        notes: notes || null,
        courier_name,
        tracking_number
      });

    if (historyError) {
      console.error('Error logging shipping status history:', historyError);
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'shipment_created',
        entity_type: 'order',
        entity_id: id,
        old_values: { 
          shipment_status: currentStatus,
          courier_name: order.courier_name,
          tracking_number: order.tracking_number
        },
        new_values: { 
          shipment_status: 'SHIPPED',
          courier_name,
          tracking_number
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    // Generate invoice after shipment creation (if not already generated)
    try {
      if (!updatedOrder.invoice_id || !updatedOrder.invoice_url) {
        const invoiceService = require('../services/invoiceService');
        
        // Get full order data for invoice generation
        const { data: fullOrder, error: orderFetchError } = await supabase
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
          .eq('id', id)
          .single();

        if (!orderFetchError && fullOrder) {
          await invoiceService.generateAndStoreInvoice(fullOrder);
          console.log(`Invoice generated for order ${id} after shipment creation`);
        }
      }
    } catch (invoiceError) {
      console.error('Error generating invoice after shipment creation:', invoiceError);
      // Non-critical - don't fail the shipment creation
    }

    res.json({
      message: 'Shipment created successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in createShipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update shipment details (courier, tracking number)
 * PUT /api/admin/orders/:id/shipping/details
 */
const updateShipmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number, notes, reason } = req.body;
    const adminId = req.user.userId;

    if (!courier_name && !tracking_number) {
      return res.status(400).json({ 
        message: 'At least courier name or tracking number must be provided' 
      });
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('courier_name, tracking_number, shipment_status')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = {
      shipment_updated_at: new Date().toISOString()
    };

    if (courier_name !== undefined) {
      updateData.courier_name = courier_name;
    }
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }
    if (notes !== undefined) {
      updateData.shipping_notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shipment details:', updateError);
      return res.status(500).json({ message: 'Error updating shipment details' });
    }

    // Log the update
    const { error: historyError } = await supabase
      .from('shipping_status_history')
      .insert({
        order_id: id,
        from_status: order.shipment_status,
        to_status: order.shipment_status, // Status unchanged
        updated_by: adminId,
        notes: reason || notes || 'Shipment details updated',
        courier_name: updatedOrder.courier_name,
        tracking_number: updatedOrder.tracking_number
      });

    if (historyError) {
      console.error('Error logging shipping update:', historyError);
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'shipment_details_updated',
        entity_type: 'order',
        entity_id: id,
        old_values: {
          courier_name: order.courier_name,
          tracking_number: order.tracking_number
        },
        new_values: {
          courier_name: updatedOrder.courier_name,
          tracking_number: updatedOrder.tracking_number,
          reason: reason || null
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json({
      message: 'Shipment details updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in updateShipmentDetails:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get shipping status history for an order
 * GET /api/admin/orders/:id/shipping/history
 */
const getShippingHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: history, error } = await supabase
      .from('shipping_status_history')
      .select(`
        *,
        updated_by_user:auth.users!updated_by (
          id,
          email
        )
      `)
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching shipping history:', error);
      return res.status(500).json({ message: 'Error fetching shipping history' });
    }

    // Format history with admin email
    const formattedHistory = (history || []).map(item => ({
      id: item.id,
      from_status: item.from_status,
      to_status: item.to_status,
      notes: item.notes,
      courier_name: item.courier_name,
      tracking_number: item.tracking_number,
      updated_by: item.updated_by,
      updated_by_email: item.updated_by_user?.email || 'N/A',
      created_at: item.created_at
    }));

    res.json({ history: formattedHistory });
  } catch (error) {
    console.error('Error in getShippingHistory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get next valid shipping statuses for an order
 * GET /api/admin/orders/:id/shipping/next-statuses
 */
const getNextValidStatuses = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('shipment_status, payment_status')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = order.shipment_status || 'NOT_SHIPPED';
    const nextStatuses = getNextValidStatus(currentStatus);

    res.json({
      currentStatus,
      nextValidStatuses: nextStatuses,
      canCreateShipment: currentStatus === 'NOT_SHIPPED' || currentStatus === 'PROCESSING',
      isPaid: order.payment_status === 'paid'
    });
  } catch (error) {
    console.error('Error in getNextValidStatuses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  updateShippingStatus,
  createShipment,
  updateShipmentDetails,
  getShippingHistory,
  getNextValidStatuses,
  validateShippingTransition,
  getNextValidStatus
};
