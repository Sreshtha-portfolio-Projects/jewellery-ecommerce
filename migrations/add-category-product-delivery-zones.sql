-- ============================================
-- CATEGORY & PRODUCT-SPECIFIC DELIVERY ZONES
-- Run this after supabase-product-features-extensions.sql
-- ============================================

-- Add category and product-specific delivery support to delivery_zones
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS category VARCHAR(100), -- e.g., 'rings', 'necklaces', 'earrings'
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS metal_type VARCHAR(50), -- e.g., 'Gold', 'Silver', 'Diamond'
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0; -- Higher priority = more specific (product > category > pincode)

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_delivery_zones_category ON delivery_zones(category);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_product ON delivery_zones(product_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_metal ON delivery_zones(metal_type);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_priority ON delivery_zones(priority DESC);

-- Add notes column for admin reference
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing zones to have priority 0 (base pincode-level)
UPDATE delivery_zones SET priority = 0 WHERE priority IS NULL;

-- Create a view for easier querying (most specific first)
CREATE OR REPLACE VIEW delivery_zones_prioritized AS
SELECT 
  *,
  CASE 
    WHEN product_id IS NOT NULL THEN 3 -- Most specific: product-level
    WHEN category IS NOT NULL THEN 2   -- Category-level
    ELSE 1                              -- Base: pincode-level
  END AS specificity_level
FROM delivery_zones
WHERE is_available = TRUE
ORDER BY priority DESC, specificity_level DESC;

-- Function to get delivery info with category/product consideration
CREATE OR REPLACE FUNCTION get_delivery_info(
  p_pincode VARCHAR(10),
  p_category VARCHAR(100) DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_metal_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  pincode VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(100),
  delivery_days INTEGER,
  shipping_charge DECIMAL(10, 2),
  is_available BOOLEAN,
  notes TEXT,
  match_type VARCHAR(50) -- 'product', 'category', 'metal', 'pincode'
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_zones AS (
    SELECT 
      dz.*,
      CASE 
        WHEN dz.product_id = p_product_id THEN 'product'
        WHEN dz.category = p_category THEN 'category'
        WHEN dz.metal_type = p_metal_type THEN 'metal'
        ELSE 'pincode'
      END AS match_type,
      CASE 
        WHEN dz.product_id = p_product_id THEN 4
        WHEN dz.category = p_category THEN 3
        WHEN dz.metal_type = p_metal_type THEN 2
        ELSE 1
      END AS match_priority
    FROM delivery_zones dz
    WHERE dz.pincode = p_pincode
      AND dz.is_available = TRUE
      AND (
        (p_product_id IS NOT NULL AND dz.product_id = p_product_id)
        OR (p_category IS NOT NULL AND dz.category = p_category)
        OR (p_metal_type IS NOT NULL AND dz.metal_type = p_metal_type)
        OR (dz.product_id IS NULL AND dz.category IS NULL AND dz.metal_type IS NULL)
      )
    ORDER BY match_priority DESC, dz.priority DESC
    LIMIT 1
  )
  SELECT 
    mz.pincode,
    mz.city,
    mz.state,
    mz.delivery_days,
    mz.shipping_charge,
    mz.is_available,
    mz.notes,
    mz.match_type
  FROM matched_zones mz;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_delivery_info IS 'Returns the most specific delivery zone match for a given pincode, considering product, category, metal type, or base pincode';
