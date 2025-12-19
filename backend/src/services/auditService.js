const supabase = require('../config/supabase');

/**
 * Audit Service - Centralized audit logging
 * Ensures all critical actions are logged consistently
 */
class AuditService {
  /**
   * Log an audit event
   * @param {Object} params
   * @param {string} params.action - Action type (e.g., 'order_status_changed', 'admin_login')
   * @param {string} params.entityType - Entity type (e.g., 'order', 'return_request', 'admin')
   * @param {string} params.entityId - Entity ID (UUID)
   * @param {string} params.userId - User ID who performed the action (null for system actions)
   * @param {Object} params.oldValues - Previous state (optional)
   * @param {Object} params.newValues - New state (optional)
   * @param {Object} params.request - Express request object (for IP and user agent)
   * @param {string} params.notes - Additional notes (optional)
   */
  async log({
    action,
    entityType,
    entityId,
    userId = null,
    oldValues = null,
    newValues = null,
    request = null,
    notes = null
  }) {
    try {
      const auditData = {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        created_at: new Date().toISOString()
      };

      // Add IP and user agent if request is provided
      if (request) {
        auditData.ip_address = request.ip || request.connection?.remoteAddress || null;
        auditData.user_agent = request.get('user-agent') || null;
      }

      // Add notes to new_values if provided
      if (notes && newValues) {
        auditData.new_values = { ...newValues, notes };
      } else if (notes) {
        auditData.new_values = { notes };
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditData);

      if (error) {
        console.error('Error logging audit:', error);
        // Don't throw - audit logging should never break the main flow
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in audit service:', error);
      // Don't throw - audit logging should never break the main flow
      return false;
    }
  }

  /**
   * Log order status change
   */
  async logOrderStatusChange(orderId, userId, oldStatus, newStatus, request, notes = null) {
    return await this.log({
      action: 'order_status_changed',
      entityType: 'order',
      entityId: orderId,
      userId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      request,
      notes
    });
  }

  /**
   * Log shipping status change
   */
  async logShippingStatusChange(orderId, userId, oldStatus, newStatus, request, notes = null) {
    return await this.log({
      action: 'shipping_status_changed',
      entityType: 'order',
      entityId: orderId,
      userId,
      oldValues: { shipment_status: oldStatus },
      newValues: { shipment_status: newStatus },
      request,
      notes
    });
  }

  /**
   * Log return request status change
   */
  async logReturnStatusChange(returnId, userId, oldStatus, newStatus, request, notes = null) {
    return await this.log({
      action: 'return_status_changed',
      entityType: 'return_request',
      entityId: returnId,
      userId,
      oldValues: { return_status: oldStatus },
      newValues: { return_status: newStatus },
      request,
      notes
    });
  }

  /**
   * Log refund completion
   */
  async logRefundCompleted(returnId, userId, refundReference, request) {
    return await this.log({
      action: 'refund_completed',
      entityType: 'return_request',
      entityId: returnId,
      userId,
      newValues: {
        refund_reference: refundReference,
        completed_at: new Date().toISOString()
      },
      request,
      notes: `Refund completed with reference: ${refundReference}`
    });
  }

  /**
   * Log admin login
   */
  async logAdminLogin(userId, email, request, success = true) {
    return await this.log({
      action: success ? 'admin_login_success' : 'admin_login_failed',
      entityType: 'admin',
      entityId: userId || 'unknown',
      userId: userId,
      newValues: {
        email,
        login_time: new Date().toISOString(),
        success
      },
      request,
      notes: success ? 'Admin login successful' : 'Admin login failed'
    });
  }

  /**
   * Log order creation
   */
  async logOrderCreation(orderId, userId, request) {
    return await this.log({
      action: 'order_created',
      entityType: 'order',
      entityId: orderId,
      userId,
      newValues: {
        created_at: new Date().toISOString()
      },
      request
    });
  }
}

module.exports = new AuditService();
