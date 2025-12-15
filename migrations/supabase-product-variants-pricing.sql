-- Product Variants and Pricing Rules Schema
-- Run this SQL in your Supabase SQL Editor
-- Extends existing products table

-- ============================================
-- 1. EXTEND PRODUCTS TABLE
-- ============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS purity VARCHAR(50), -- e.g., "18K", "22K", "925"
ADD COLUMN IF NOT EXISTS karat INTEGER, -- e.g., 18, 22, 24
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update base_price from price if not set
UPDATE products SET base_price = price WHERE base_price IS NULL;
UPDATE products SET is_active = TRUE WHERE is_active IS NULL;

-- ============================================
-- 2. PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50), -- Ring size, chain length, etc.
  color VARCHAR(50), -- Gold, Rose Gold, Silver, etc.
  finish VARCHAR(50), -- Polished, Matte, etc.
  weight DECIMAL(10, 2), -- Weight in grams
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  price_override DECIMAL(10, 2), -- Overrides base_price if set
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_variant UNIQUE(product_id, size, color, finish)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock_quantity);

-- ============================================
-- 3. VARIANT-SPECIFIC IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS variant_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_product ON variant_images(product_id);

-- ============================================
-- 4. PRICING RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL, -- 'metal_markup', 'weight_based', 'category_adjustment', 'seasonal', 'custom'
  conditions JSONB NOT NULL, -- Flexible conditions (e.g., {"metal_type": "GOLD", "weight": {"operator": ">", "value": 5}})
  action_type VARCHAR(50) NOT NULL, -- 'percentage_markup', 'fixed_markup', 'percentage_discount', 'fixed_discount'
  action_value DECIMAL(10, 2) NOT NULL, -- Percentage or fixed amount
  priority INTEGER DEFAULT 0, -- Higher priority rules applied first
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- ============================================
-- 5. BULK IMPORT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bulk_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES auth.users(id),
  import_type VARCHAR(50) NOT NULL, -- 'products', 'variants', 'both'
  file_name VARCHAR(255),
  total_rows INTEGER,
  successful_rows INTEGER,
  failed_rows INTEGER,
  errors JSONB, -- Array of error objects with row number and message
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bulk_imports_admin ON bulk_import_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_imports_status ON bulk_import_logs(status);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Public variant images are viewable by everyone" ON variant_images;
DROP POLICY IF EXISTS "Public pricing rules are viewable by everyone" ON pricing_rules;

-- RLS Policies: Public read access
CREATE POLICY "Public variants are viewable by everyone"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "Public variant images are viewable by everyone"
  ON variant_images FOR SELECT
  USING (true);

CREATE POLICY "Public pricing rules are viewable by everyone"
  ON pricing_rules FOR SELECT
  USING (is_active = true);

-- Note: Admin operations (INSERT/UPDATE/DELETE) are handled by backend with service role key
-- which bypasses RLS, so no additional policies needed for admin operations

