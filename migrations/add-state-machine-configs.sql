-- ============================================
-- ADD STATE MACHINE CONFIGURATIONS
-- Moves hardcoded business rules to admin_settings
-- ============================================

-- Order Status Transitions
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) 
VALUES (
  'order_status_transitions',
  '{"CREATED":["paid","cancelled","shipped"],"pending":["paid","cancelled"],"paid":["shipped","cancelled"],"shipped":["delivered","returned"],"delivered":["returned"],"returned":[],"cancelled":[]}',
  'json',
  'orders',
  'Order status state machine - defines valid status transitions'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Shipping Status Transitions
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) 
VALUES (
  'shipping_status_transitions',
  '{"NOT_SHIPPED":["PROCESSING"],"PROCESSING":["SHIPPED"],"SHIPPED":["IN_TRANSIT"],"IN_TRANSIT":["OUT_FOR_DELIVERY"],"OUT_FOR_DELIVERY":["DELIVERED"],"DELIVERED":["RETURNED"],"RETURNED":[]}',
  'json',
  'shipping',
  'Shipping status state machine - defines valid shipping status transitions'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Return Status Transitions
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) 
VALUES (
  'return_status_transitions',
  '{"NONE":["REQUESTED"],"REQUESTED":["APPROVED","REJECTED"],"APPROVED":["RECEIVED"],"REJECTED":[],"RECEIVED":["REFUND_INITIATED"],"REFUND_INITIATED":["REFUNDED"],"REFUNDED":[]}',
  'json',
  'returns',
  'Return status state machine - defines valid return status transitions'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Add comment
COMMENT ON TABLE admin_settings IS 'Central configuration store - all business rules should be stored here, not hardcoded in application code';
