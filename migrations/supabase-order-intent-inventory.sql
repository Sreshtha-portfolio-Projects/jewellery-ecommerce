-- Order Intent, Inventory Locking & Admin Settings Schema
-- Run this SQL in your Supabase SQL Editor
-- Foundation for payment-ready system

-- ============================================
-- 1. ADMIN SETTINGS TABLE (Central Configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  category VARCHAR(50) DEFAULT 'general', -- 'pricing', 'inventory', 'checkout', 'tax', 'shipping'
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) VALUES
('tax_percentage', '18', 'number', 'tax', 'GST percentage (e.g., 18 for 18%)'),
('shipping_charge', '0', 'number', 'shipping', 'Default shipping charge in INR'),
('free_shipping_threshold', '5000', 'number', 'shipping', 'Free shipping above this amount'),
('inventory_lock_duration_minutes', '30', 'number', 'inventory', 'How long to lock inventory for order intent'),
('inventory_auto_release', 'true', 'boolean', 'inventory', 'Automatically release locked inventory on expiry'),
('abandoned_cart_timeout_minutes', '60', 'number', 'checkout', 'Cart considered abandoned after X minutes of inactivity'),
('checkout_enabled', 'true', 'boolean', 'checkout', 'Enable/disable checkout globally'),
('maintenance_mode', 'false', 'boolean', 'checkout', 'Maintenance mode - blocks all checkout'),
('order_intent_expiry_minutes', '30', 'number', 'checkout', 'Order intent expiry time in minutes'),
('price_rounding_method', 'round', 'string', 'pricing', 'round, floor, ceil'),
('currency', 'INR', 'string', 'pricing', 'Currency code')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 2. ORDER INTENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'INTENT_CREATED', 'EXPIRED', 'CONVERTED', 'CANCELLED')),
  
  -- Cart Snapshot (JSON)
  cart_snapshot JSONB NOT NULL, -- Full cart state at intent creation
  
  -- Pricing Breakdown
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_charge DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Discount/Coupon
  discount_code VARCHAR(100),
  discount_id UUID REFERENCES discounts(id),
  
  -- Shipping
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  
  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE, -- When converted to actual order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB, -- Additional data like pricing rules applied, etc.
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_order_intents_user ON order_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_order_intents_status ON order_intents(status);
CREATE INDEX IF NOT EXISTS idx_order_intents_expires ON order_intents(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_intents_number ON order_intents(intent_number);

-- ============================================
-- 3. INVENTORY LOCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_intent_id UUID NOT NULL REFERENCES order_intents(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity_locked INTEGER NOT NULL CHECK (quantity_locked > 0),
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'LOCKED'
    CHECK (status IN ('LOCKED', 'RELEASED', 'CONVERTED', 'EXPIRED')),
  
  UNIQUE(order_intent_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_locks_intent ON inventory_locks(order_intent_id);
CREATE INDEX IF NOT EXISTS idx_inventory_locks_variant ON inventory_locks(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_locks_status ON inventory_locks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_locks_expires ON inventory_locks(expires_at);

-- ============================================
-- 4. ABANDONED CARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest users
  cart_value DECIMAL(10, 2) NOT NULL,
  item_count INTEGER NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  abandoned_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'ABANDONED'
    CHECK (status IN ('ACTIVE', 'ABANDONED', 'RECOVERED', 'EXPIRED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_activity ON abandoned_carts(last_activity_at);

-- ============================================
-- 5. PRICING CALCULATION LOGS (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_calculation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_intent_id UUID REFERENCES order_intents(id),
  calculation_type VARCHAR(50), -- 'order_intent', 'cart_revalidation', 'manual'
  base_price DECIMAL(10, 2),
  pricing_rules_applied JSONB, -- Array of rules that were applied
  discount_applied JSONB,
  tax_calculation JSONB,
  shipping_calculation JSONB,
  final_price DECIMAL(10, 2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_logs_intent ON pricing_calculation_logs(order_intent_id);
CREATE INDEX IF NOT EXISTS idx_pricing_logs_type ON pricing_calculation_logs(calculation_type);

-- ============================================
-- 6. UPDATE ORDERS TABLE (Link to Order Intent)
-- ============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_intent_id UUID REFERENCES order_intents(id);

CREATE INDEX IF NOT EXISTS idx_orders_intent ON orders(order_intent_id);

-- ============================================
-- 7. UPDATE DISCOUNTS TABLE (Add Usage Tracking)
-- ============================================
ALTER TABLE discounts
ADD COLUMN IF NOT EXISTS locked_by_intent_id UUID REFERENCES order_intents(id),
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10, 2); -- Max cap for percentage discounts

CREATE INDEX IF NOT EXISTS idx_discounts_locked ON discounts(locked_by_intent_id);

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to increment stock
CREATE OR REPLACE FUNCTION increment_stock(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + quantity
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = GREATEST(0, stock_quantity - quantity)
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-release expired inventory locks
CREATE OR REPLACE FUNCTION release_expired_inventory_locks()
RETURNS void AS $$
BEGIN
  UPDATE inventory_locks
  SET 
    status = 'EXPIRED',
    released_at = NOW()
  WHERE 
    status = 'LOCKED' 
    AND expires_at < NOW();
    
  -- Restore stock
  UPDATE product_variants pv
  SET stock_quantity = stock_quantity + il.quantity_locked
  FROM inventory_locks il
  WHERE 
    il.variant_id = pv.id
    AND il.status = 'EXPIRED'
    AND il.released_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM inventory_locks il2 
      WHERE il2.id = il.id AND il2.released_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to expire order intents
CREATE OR REPLACE FUNCTION expire_order_intents()
RETURNS void AS $$
BEGIN
  UPDATE order_intents
  SET 
    status = 'EXPIRED',
    updated_at = NOW()
  WHERE 
    status = 'INTENT_CREATED'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark abandoned carts
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS void AS $$
DECLARE
  timeout_minutes INTEGER;
BEGIN
  -- Get timeout from settings
  SELECT CAST(setting_value AS INTEGER) INTO timeout_minutes
  FROM admin_settings
  WHERE setting_key = 'abandoned_cart_timeout_minutes';
  
  IF timeout_minutes IS NULL THEN
    timeout_minutes := 60; -- Default
  END IF;
  
  UPDATE abandoned_carts
  SET 
    status = 'ABANDONED',
    abandoned_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'ACTIVE'
    AND last_activity_at < NOW() - (timeout_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_intents_updated_at
  BEFORE UPDATE ON order_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE order_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own order intents" ON order_intents;
DROP POLICY IF EXISTS "Public can view admin settings" ON admin_settings;

-- Users can view their own order intents
CREATE POLICY "Users can view their own order intents"
  ON order_intents FOR SELECT
  USING (auth.uid() = user_id);

-- Public read access to settings (for pricing calculations)
CREATE POLICY "Public can view admin settings"
  ON admin_settings FOR SELECT
  USING (true);

-- Note: Admin operations (INSERT/UPDATE/DELETE) are handled by backend with service role key

