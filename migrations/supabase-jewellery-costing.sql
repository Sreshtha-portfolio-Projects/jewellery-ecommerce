-- Jewellery Costing Fields Migration
-- Run this SQL in your Supabase SQL Editor to add jewellery industry costing support

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS item_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS family VARCHAR(50),
  ADD COLUMN IF NOT EXISTS item_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pieces INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS stones JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS labour JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS add_charge DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_percent DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_weight DECIMAL(8, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_weight DECIMAL(8, 3),
  ADD COLUMN IF NOT EXISTS visibility JSONB DEFAULT '{
    "metalSection": true,
    "stoneSection": true,
    "labourSection": false,
    "addCharge": false,
    "costPrice": false,
    "overhead": false,
    "margin": false,
    "priceBreakdown": false,
    "itemCode": true,
    "grossWeight": true
  }';

-- Pricing model: internal cost vs customer-visible amounts
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS labour_cost_internal DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labour_charge_visible DECIMAL(10, 2) DEFAULT 0;

-- Pricing formula (all computed in backend):
--   overhead_amount      = labour_cost_internal * overhead_percent / 100
--   subtotal             = metal_amount + stone_amount + labour_cost_internal + overhead_amount
--   margin_amount        = subtotal * margin_percent / 100
--   final_total_price    = subtotal + margin_amount
--   labour_charge_visible = final_total_price - metal_amount - stone_amount
-- Customer sees ONLY: metal_amount, stone_amount, labour_charge_visible, final_total_price

-- Index on item_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(item_code);

-- Example: after running this, the products table will have all new costing columns
-- The selling_price is the final price shown to customers
-- metals/stones/labour are JSONB arrays storing cost sheet rows
-- visibility controls which sections/fields appear on the customer product page