-- ============================================
-- PAYMENT & SHIPPING EXTENSIONS
-- Run this after supabase-schema-extensions.sql
-- ============================================

-- Add payment and shipping fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_online_order BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipment_status VARCHAR(50) DEFAULT 'NOT_SHIPPED'
  CHECK (shipment_status IN ('NOT_SHIPPED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED')),
ADD COLUMN IF NOT EXISTS shipment_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipment_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_status ON orders(shipment_status);
CREATE INDEX IF NOT EXISTS idx_orders_online ON orders(is_online_order);

-- Update order status to include PAYMENT_PENDING
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'PAYMENT_PENDING', 'paid', 'shipped', 'delivered', 'returned', 'cancelled', 'FAILED'));

-- Create shipments table for detailed tracking
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_provider VARCHAR(50) NOT NULL, -- 'shiprocket', 'delhivery', 'bluedart', 'manual'
  courier_name VARCHAR(100),
  tracking_number VARCHAR(255) UNIQUE,
  awb_number VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'NOT_SHIPPED'
    CHECK (status IN ('NOT_SHIPPED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'EXCEPTION')),
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  current_location TEXT,
  tracking_events JSONB, -- Array of tracking events
  courier_response JSONB, -- Full response from courier API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet', 'emi'
  payment_status VARCHAR(50) NOT NULL, -- 'pending', 'captured', 'failed', 'refunded'
  razorpay_response JSONB,
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);

-- Function to update shipment status
CREATE OR REPLACE FUNCTION update_shipment_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipment_status != OLD.shipment_status THEN
    NEW.shipment_updated_at = NOW();
    
    -- Update order status based on shipment status
    IF NEW.shipment_status = 'SHIPPED' AND NEW.status = 'paid' THEN
      NEW.status = 'shipped';
    ELSIF NEW.shipment_status = 'DELIVERED' THEN
      NEW.status = 'delivered';
    ELSIF NEW.shipment_status = 'RETURNED' THEN
      NEW.status = 'returned';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for shipment status updates
DROP TRIGGER IF EXISTS trigger_shipment_tracking ON orders;
CREATE TRIGGER trigger_shipment_tracking
  BEFORE UPDATE OF shipment_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_tracking();

-- Update updated_at for shipments
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for payment_transactions
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

