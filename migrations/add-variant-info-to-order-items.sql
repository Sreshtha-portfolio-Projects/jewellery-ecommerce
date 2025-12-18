-- Add variant information to order_items for immutable snapshot
-- This allows us to display variant details (size, color, metal) on order confirmation
-- Run this after supabase-schema-extensions.sql

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_snapshot JSONB; -- Stores size, color, finish, weight at time of order

-- Add index for variant lookups
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

-- Add comment
COMMENT ON COLUMN order_items.variant_snapshot IS 'Immutable snapshot of variant attributes (size, color, finish, weight) at time of order';
