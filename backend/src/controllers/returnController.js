const supabase = require('../config/supabase');
const configService = require('../services/configService');
const auditService = require('../services/auditService');

// Validate return transition using config service (no hardcoded values)
const validateReturnTransition = async (fromStatus, toStatus) => {
  return await configService.validateReturnTransition(fromStatus, toStatus);
};

/**
 * Create a return request (User)
 * POST /api/returns
 */
const createReturnRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId, returnReason, returnNote } = req.body;

    if (!orderId || !returnReason) {
      return res.status(400).json({ message: 'Order ID and return reason are required' });
    }

    // Get order to validate
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, shipment_status, total_amount, created_at')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is delivered
    if (order.shipment_status !== 'DELIVERED') {
      return res.status(400).json({ 
        message: 'Returns can only be requested for delivered orders' 
      });
    }

    // Check return window (configurable via admin settings)
    const { data: returnWindowSetting } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'return_window_days')
      .single();
    
    const returnWindowDays = returnWindowSetting 
      ? parseFloat(returnWindowSetting.setting_value) || 7
      : 7; // Default to 7 days if setting not found
    
    // Use delivery date for return window calculation (more accurate)
    // If order is delivered, use shipment_updated_at when status changed to DELIVERED
    // Otherwise fall back to order creation date
    let referenceDate = new Date(order.created_at);
    
    // Try to get actual delivery date from shipping history
    const { data: deliveryHistory } = await supabase
      .from('shipping_status_history')
      .select('created_at')
      .eq('order_id', orderId)
      .eq('to_status', 'DELIVERED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (deliveryHistory && deliveryHistory.created_at) {
      referenceDate = new Date(deliveryHistory.created_at);
    }
    
    const daysSinceDelivery = (new Date() - referenceDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({ 
        message: `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery.` 
      });
    }

    // Check if return request already exists
    const { data: existingReturn } = await supabase
      .from('return_requests')
      .select('id, return_status')
      .eq('order_id', orderId)
      .single();

    if (existingReturn) {
      return res.status(400).json({ 
        message: 'A return request already exists for this order',
        returnStatus: existingReturn.return_status
      });
    }

    // Create return request
    const { data: returnRequest, error: returnError } = await supabase
      .from('return_requests')
      .insert({
        order_id: orderId,
        user_id: userId,
        return_status: 'REQUESTED',
        return_reason: returnReason,
        return_note: returnNote || null,
        refund_amount: order.total_amount // Store refund amount from order snapshot
      })
      .select()
      .single();

    if (returnError) {
      console.error('Error creating return request:', returnError);
      return res.status(500).json({ message: 'Error creating return request' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: returnRequest.id,
      from_status: 'NONE',
      to_status: 'REQUESTED',
      changed_by: userId,
      notes: `Return requested. Reason: ${returnReason}`
    });

    // Log audit
    await auditService.logReturnStatusChange(returnRequest.id, userId, 'NONE', 'REQUESTED', req, `Return requested. Reason: ${returnReason}`);

    res.status(201).json(returnRequest);
  } catch (error) {
    console.error('Error in createReturnRequest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get return request by order ID (User)
 * GET /api/returns/order/:orderId
 */
const getReturnRequestByOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const { data: returnRequest, error } = await supabase
      .from('return_requests')
      .select(`
        *,
        return_request_history (
          id,
          from_status,
          to_status,
          changed_by,
          notes,
          created_at
        )
      `)
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    res.json(returnRequest);
  } catch (error) {
    console.error('Error in getReturnRequestByOrder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all return requests (Admin)
 * GET /api/admin/returns
 */
const getAllReturnRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('return_requests')
      .select(`
        id,
        order_id,
        user_id,
        return_status,
        return_reason,
        return_note,
        refund_amount,
        created_at,
        updated_at,
        orders!inner (
          order_number,
          total_amount
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      query = query.eq('return_status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching return requests:', error);
      return res.status(500).json({ message: 'Error fetching return requests' });
    }

    // Get user emails for customer names
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    const { data: users } = await supabase.auth.admin.listUsers();
    const userMap = {};
    (users?.users || []).forEach(u => {
      userMap[u.id] = u.email;
    });

    const returnsWithCustomer = (data || []).map(returnReq => ({
      id: returnReq.id,
      orderId: returnReq.order_id,
      orderNumber: returnReq.orders?.order_number || 'N/A',
      customerName: userMap[returnReq.user_id] || 'N/A',
      returnReason: returnReq.return_reason,
      returnNote: returnReq.return_note,
      requestDate: returnReq.created_at,
      returnStatus: returnReq.return_status,
      refundAmount: returnReq.refund_amount
    }));

    res.json({
      returns: returnsWithCustomer,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getAllReturnRequests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get return request details (Admin)
 * GET /api/admin/returns/:id
 */
const getReturnRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: returnRequest, error } = await supabase
      .from('return_requests')
      .select(`
        *,
        orders (
          id,
          order_number,
          total_amount,
          created_at,
          shipment_status,
          order_items (
            id,
            product_name,
            quantity,
            product_price,
            subtotal
          ),
          shipping_address:addresses!shipping_address_id (*)
        ),
        return_request_history (
          id,
          from_status,
          to_status,
          changed_by,
          notes,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Get customer email
    const { data: user } = await supabase.auth.admin.getUserById(returnRequest.user_id);
    returnRequest.customerEmail = user?.user?.email || 'N/A';

    res.json(returnRequest);
  } catch (error) {
    console.error('Error in getReturnRequestDetails:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Approve return request (Admin)
 * PUT /api/admin/returns/:id/approve
 */
const approveReturnRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { returnInstructions, returnAddress } = req.body;

    if (!returnInstructions || !returnAddress) {
      return res.status(400).json({ 
        message: 'Return instructions and return address are required' 
      });
    }

    // Get current return request
    const { data: returnRequest, error: fetchError } = await supabase
      .from('return_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate transition
    const isValidTransition = await validateReturnTransition(returnRequest.return_status, 'APPROVED');
    if (!isValidTransition) {
      return res.status(400).json({ 
        message: `Cannot approve return request. Current status: ${returnRequest.return_status}` 
      });
    }

    // Update return request
    const { data: updatedReturn, error: updateError } = await supabase
      .from('return_requests')
      .update({
        return_status: 'APPROVED',
        return_instructions: returnInstructions,
        return_address: returnAddress,
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving return request:', updateError);
      return res.status(500).json({ message: 'Error approving return request' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: id,
      from_status: returnRequest.return_status,
      to_status: 'APPROVED',
      changed_by: userId,
      notes: `Return approved by admin. Instructions: ${returnInstructions}`
    });

    // Log audit
    await auditService.logReturnStatusChange(id, userId, returnRequest.return_status, 'APPROVED', req, `Return approved by admin. Instructions: ${returnInstructions}`);

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error in approveReturnRequest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reject return request (Admin)
 * PUT /api/admin/returns/:id/reject
 */
const rejectReturnRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Get current return request
    const { data: returnRequest, error: fetchError } = await supabase
      .from('return_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate transition
    if (!validateReturnTransition(returnRequest.return_status, 'REJECTED')) {
      return res.status(400).json({ 
        message: `Cannot reject return request. Current status: ${returnRequest.return_status}` 
      });
    }

    // Update return request
    const { data: updatedReturn, error: updateError } = await supabase
      .from('return_requests')
      .update({
        return_status: 'REJECTED',
        rejection_reason: rejectionReason,
        rejected_by: userId,
        rejected_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting return request:', updateError);
      return res.status(500).json({ message: 'Error rejecting return request' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: id,
      from_status: returnRequest.return_status,
      to_status: 'REJECTED',
      changed_by: userId,
      notes: `Return rejected. Reason: ${rejectionReason}`
    });

    // Log audit
    await auditService.logReturnStatusChange(id, userId, returnRequest.return_status, 'REJECTED', req, `Return rejected. Reason: ${rejectionReason}`);

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error in rejectReturnRequest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Mark return as received (Admin)
 * PUT /api/admin/returns/:id/received
 */
const markReturnReceived = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get current return request
    const { data: returnRequest, error: fetchError } = await supabase
      .from('return_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate transition
    const isValidTransition = await validateReturnTransition(returnRequest.return_status, 'RECEIVED');
    if (!isValidTransition) {
      return res.status(400).json({ 
        message: `Cannot mark as received. Current status: ${returnRequest.return_status}` 
      });
    }

    // Update return request
    const { data: updatedReturn, error: updateError } = await supabase
      .from('return_requests')
      .update({
        return_status: 'RECEIVED',
        received_by: userId,
        received_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error marking return as received:', updateError);
      return res.status(500).json({ message: 'Error marking return as received' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: id,
      from_status: returnRequest.return_status,
      to_status: 'RECEIVED',
      changed_by: userId,
      notes: 'Return item received and inspected'
    });

    // Log audit
    await auditService.logReturnStatusChange(id, userId, returnRequest.return_status, 'RECEIVED', req, 'Return item received and inspected');

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error in markReturnReceived:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Initiate refund (Admin)
 * PUT /api/admin/returns/:id/initiate-refund
 */
const initiateRefund = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get current return request
    const { data: returnRequest, error: fetchError } = await supabase
      .from('return_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate transition
    if (!validateReturnTransition(returnRequest.return_status, 'REFUND_INITIATED')) {
      return res.status(400).json({ 
        message: `Cannot initiate refund. Current status: ${returnRequest.return_status}` 
      });
    }

    // Update return request
    const { data: updatedReturn, error: updateError } = await supabase
      .from('return_requests')
      .update({
        return_status: 'REFUND_INITIATED',
        refund_initiated_by: userId,
        refund_initiated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error initiating refund:', updateError);
      return res.status(500).json({ message: 'Error initiating refund' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: id,
      from_status: returnRequest.return_status,
      to_status: 'REFUND_INITIATED',
      changed_by: userId,
      notes: 'Refund process initiated'
    });

    // Log audit
    await auditService.logReturnStatusChange(id, userId, returnRequest.return_status, 'REFUND_INITIATED', req, 'Refund process initiated');

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error in initiateRefund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Complete refund (Admin)
 * PUT /api/admin/returns/:id/complete-refund
 */
const completeRefund = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { refundReference } = req.body;

    if (!refundReference) {
      return res.status(400).json({ message: 'Refund reference is required' });
    }

    // Get current return request
    const { data: returnRequest, error: fetchError } = await supabase
      .from('return_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Validate transition
    const isValidTransition = await validateReturnTransition(returnRequest.return_status, 'REFUNDED');
    if (!isValidTransition) {
      return res.status(400).json({ 
        message: `Cannot complete refund. Current status: ${returnRequest.return_status}` 
      });
    }

    // Update return request
    const { data: updatedReturn, error: updateError } = await supabase
      .from('return_requests')
      .update({
        return_status: 'REFUNDED',
        refund_reference: refundReference,
        refund_date: new Date().toISOString(),
        refunded_by: userId,
        refunded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing refund:', updateError);
      return res.status(500).json({ message: 'Error completing refund' });
    }

    // Log return request history
    await supabase.from('return_request_history').insert({
      return_request_id: id,
      from_status: returnRequest.return_status,
      to_status: 'REFUNDED',
      changed_by: userId,
      notes: `Refund completed. Reference: ${refundReference}`
    });

    // Log audit
    await auditService.logRefundCompleted(id, userId, refundReference, req);

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error in completeRefund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createReturnRequest,
  getReturnRequestByOrder,
  getAllReturnRequests,
  getReturnRequestDetails,
  approveReturnRequest,
  rejectReturnRequest,
  markReturnReceived,
  initiateRefund,
  completeRefund
};
