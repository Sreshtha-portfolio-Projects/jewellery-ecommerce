-- Stock Management Fix
-- Handles both product-level and variant-level inventory
-- Run this to fix the order intent creation issues

-- ============================================
-- 1. DROP OLD FUNCTIONS
-- ============================================
DROP FUNCTION IF EXISTS decrement_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_stock(UUID, INTEGER);

-- ============================================
-- 2. UNIVERSAL STOCK MANAGEMENT FUNCTIONS
-- ============================================

-- Decrement stock (works for both products and variants)
CREATE OR REPLACE FUNCTION decrement_stock(
  item_id UUID,
  quantity INTEGER,
  is_variant BOOLEAN DEFAULT TRUE
)
RETURNS void AS $$
BEGIN
  IF is_variant THEN
    -- Update variant stock
    UPDATE product_variants
    SET stock_quantity = GREATEST(0, stock_quantity - quantity)
    WHERE id = item_id;
  ELSE
    -- Update product stock
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - quantity)
    WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Increment stock (works for both products and variants)
CREATE OR REPLACE FUNCTION increment_stock(
  item_id UUID,
  quantity INTEGER,
  is_variant BOOLEAN DEFAULT TRUE
)
RETURNS void AS $$
BEGIN
  IF is_variant THEN
    -- Update variant stock
    UPDATE product_variants
    SET stock_quantity = stock_quantity + quantity
    WHERE id = item_id;
  ELSE
    -- Update product stock
    UPDATE products
    SET stock_quantity = stock_quantity + quantity
    WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. GET AVAILABLE STOCK FUNCTION
-- ============================================

-- Get available stock considering locks
CREATE OR REPLACE FUNCTION get_available_stock(
  item_id UUID,
  is_variant BOOLEAN DEFAULT TRUE
)
RETURNS INTEGER AS $$
DECLARE
  total_stock INTEGER;
  locked_stock INTEGER;
BEGIN
  -- Get total stock
  IF is_variant THEN
    SELECT stock_quantity INTO total_stock
    FROM product_variants
    WHERE id = item_id;
  ELSE
    SELECT stock_quantity INTO total_stock
    FROM products
    WHERE id = item_id;
  END IF;
  
  -- Get locked stock
  SELECT COALESCE(SUM(quantity_locked), 0) INTO locked_stock
  FROM inventory_locks
  WHERE variant_id = item_id
    AND status = 'LOCKED'
    AND expires_at > NOW();
  
  -- Return available stock
  RETURN GREATEST(0, COALESCE(total_stock, 0) - COALESCE(locked_stock, 0));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. UPDATE INVENTORY_LOCKS TABLE
-- ============================================

-- Add column to track if lock is for product or variant
ALTER TABLE inventory_locks
ADD COLUMN IF NOT EXISTS is_variant_lock BOOLEAN DEFAULT TRUE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_locks_item 
ON inventory_locks(variant_id, is_variant_lock, status);

-- ============================================
-- 5. UPDATE EXPIRED LOCK RELEASE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION release_expired_inventory_locks()
RETURNS void AS $$
BEGIN
  -- Mark locks as expired
  UPDATE inventory_locks
  SET 
    status = 'EXPIRED',
    released_at = NOW()
  WHERE 
    status = 'LOCKED' 
    AND expires_at < NOW();
    
  -- Restore variant stock
  UPDATE product_variants pv
  SET stock_quantity = stock_quantity + il.quantity_locked
  FROM inventory_locks il
  WHERE 
    il.variant_id = pv.id
    AND il.is_variant_lock = TRUE
    AND il.status = 'EXPIRED'
    AND il.released_at >= NOW() - INTERVAL '1 minute';
    
  -- Restore product stock
  UPDATE products p
  SET stock_quantity = stock_quantity + il.quantity_locked
  FROM inventory_locks il
  WHERE 
    il.variant_id = p.id
    AND il.is_variant_lock = FALSE
    AND il.status = 'EXPIRED'
    AND il.released_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;
