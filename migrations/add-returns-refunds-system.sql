-- ============================================
-- RETURNS & REFUNDS SYSTEM
-- Run this after add-shipping-state-machine.sql
-- ============================================

-- Create return_requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  return_status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED'
    CHECK (return_status IN ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_INITIATED', 'REFUNDED')),
  return_reason VARCHAR(100) NOT NULL, -- Size issue, Damaged item, Not as expected
  return_note TEXT,
  rejection_reason TEXT, -- Admin-provided reason if rejected
  return_instructions TEXT, -- Admin-provided return instructions
  return_address TEXT, -- Admin-provided return address
  refund_amount DECIMAL(10, 2), -- Calculated from order snapshot
  refund_date TIMESTAMP WITH TIME ZONE,
  refund_reference VARCHAR(255), -- Manual reference for now
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id), -- Admin who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id), -- Admin who rejected
  rejected_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES auth.users(id), -- Admin who marked as received
  received_at TIMESTAMP WITH TIME ZONE,
  refund_initiated_by UUID REFERENCES auth.users(id),
  refund_initiated_at TIMESTAMP WITH TIME ZONE,
  refunded_by UUID REFERENCES auth.users(id),
  refunded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(order_id) -- One return request per order
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(return_status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created ON return_requests(created_at);

-- Create return_request_history table for audit trail
CREATE TABLE IF NOT EXISTS return_request_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_request_history_return ON return_request_history(return_request_id);
CREATE INDEX IF NOT EXISTS idx_return_request_history_created ON return_request_history(created_at);

-- Add invoice fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_created_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(invoice_id);

-- Function to log return status changes
CREATE OR REPLACE FUNCTION log_return_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_status != OLD.return_status THEN
    INSERT INTO return_request_history (
      return_request_id,
      from_status,
      to_status,
      changed_by,
      created_at
    )
    VALUES (
      NEW.id,
      OLD.return_status,
      NEW.return_status,
      COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      ),
      NOW()
    );
    
    -- Update timestamps based on status
    IF NEW.return_status = 'APPROVED' AND OLD.return_status != 'APPROVED' THEN
      NEW.approved_at = NOW();
      NEW.approved_by = COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      );
    END IF;
    
    IF NEW.return_status = 'REJECTED' AND OLD.return_status != 'REJECTED' THEN
      NEW.rejected_at = NOW();
      NEW.rejected_by = COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      );
    END IF;
    
    IF NEW.return_status = 'RECEIVED' AND OLD.return_status != 'RECEIVED' THEN
      NEW.received_at = NOW();
      NEW.received_by = COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      );
    END IF;
    
    IF NEW.return_status = 'REFUND_INITIATED' AND OLD.return_status != 'REFUND_INITIATED' THEN
      NEW.refund_initiated_at = NOW();
      NEW.refund_initiated_by = COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      );
    END IF;
    
    IF NEW.return_status = 'REFUNDED' AND OLD.return_status != 'REFUNDED' THEN
      NEW.refunded_at = NOW();
      NEW.refunded_by = COALESCE(
        (SELECT user_id FROM audit_logs WHERE entity_id = NEW.order_id ORDER BY created_at DESC LIMIT 1),
        NEW.user_id
      );
      NEW.refund_date = NOW();
    END IF;
    
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for return status changes
DROP TRIGGER IF EXISTS trigger_log_return_status ON return_requests;
CREATE TRIGGER trigger_log_return_status
  AFTER UPDATE OF return_status ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_return_status_change();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_return_requests_updated_at ON return_requests;
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for return_requests
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own return requests" ON return_requests;
CREATE POLICY "Users can view own return requests"
  ON return_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own return requests" ON return_requests;
CREATE POLICY "Users can create own return requests"
  ON return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for return_request_history
ALTER TABLE return_request_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own return request history" ON return_request_history;
CREATE POLICY "Users can view own return request history"
  ON return_request_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM return_requests 
      WHERE return_requests.id = return_request_history.return_request_id 
      AND return_requests.user_id = auth.uid()
    )
  );

-- Admin access is handled via backend service role key
