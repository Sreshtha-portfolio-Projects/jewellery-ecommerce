-- ============================================
-- SHIPPING STATE MACHINE IMPLEMENTATION
-- Run this after supabase-payment-shipping-extensions.sql
-- ============================================

-- Add shipping_notes column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_notes TEXT;

-- Update shipment_status constraint to include all required states
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_shipment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_shipment_status_check 
CHECK (shipment_status IN ('NOT_SHIPPED', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'));

-- Create shipping_status_history table for audit trail
CREATE TABLE IF NOT EXISTS shipping_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  courier_name VARCHAR(100),
  tracking_number VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_status_history_order ON shipping_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_status_history_created ON shipping_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_shipping_status_history_status ON shipping_status_history(to_status);

-- Update the shipment_status default to ensure new orders start with NOT_SHIPPED
ALTER TABLE orders 
ALTER COLUMN shipment_status SET DEFAULT 'NOT_SHIPPED';

-- Function to log shipping status changes
CREATE OR REPLACE FUNCTION log_shipping_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipment_status != OLD.shipment_status THEN
    -- Log the status change
    INSERT INTO shipping_status_history (
      order_id,
      from_status,
      to_status,
      updated_by,
      courier_name,
      tracking_number,
      created_at
    )
    VALUES (
      NEW.id,
      OLD.shipment_status,
      NEW.shipment_status,
      COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      ),
      NEW.courier_name,
      NEW.tracking_number,
      NOW()
    );
    
    -- Update shipment timestamps
    IF NEW.shipment_status = 'SHIPPED' AND OLD.shipment_status != 'SHIPPED' THEN
      NEW.shipment_created_at = COALESCE(NEW.shipment_created_at, NOW());
    END IF;
    
    NEW.shipment_updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_log_shipping_status ON orders;

-- Create trigger to log shipping status changes
CREATE TRIGGER trigger_log_shipping_status
  AFTER UPDATE OF shipment_status, courier_name, tracking_number ON orders
  FOR EACH ROW
  WHEN (OLD.shipment_status IS DISTINCT FROM NEW.shipment_status 
        OR OLD.courier_name IS DISTINCT FROM NEW.courier_name
        OR OLD.tracking_number IS DISTINCT FROM NEW.tracking_number)
  EXECUTE FUNCTION log_shipping_status_change();
