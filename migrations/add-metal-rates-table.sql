-- Metal Rates Table Migration
-- Stores the latest fetched gold/silver prices from MetalPriceAPI
-- Only one active rate per metal_type is kept (upsert by metal_type)

CREATE TABLE IF NOT EXISTS metal_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type    VARCHAR(20)    NOT NULL,          -- 'gold' | 'silver'
  price_per_gram DECIMAL(12, 4) NOT NULL,
  price_per_oz   DECIMAL(12, 4),                  -- raw value from API (troy oz)
  currency      VARCHAR(10)    NOT NULL DEFAULT 'INR',
  source        VARCHAR(100)   DEFAULT 'metalpriceapi',
  last_updated  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT metal_rates_metal_type_unique UNIQUE (metal_type)
);

-- History table: append-only log of every rate fetch for audit/charting
CREATE TABLE IF NOT EXISTS metal_rates_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type    VARCHAR(20)    NOT NULL,
  price_per_gram DECIMAL(12, 4) NOT NULL,
  price_per_oz   DECIMAL(12, 4),
  currency      VARCHAR(10)    NOT NULL DEFAULT 'INR',
  source        VARCHAR(100)   DEFAULT 'metalpriceapi',
  fetched_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_by    UUID           -- admin user_id who triggered the fetch (NULL = scheduled)
);

CREATE INDEX IF NOT EXISTS idx_metal_rates_history_metal_type ON metal_rates_history(metal_type);
CREATE INDEX IF NOT EXISTS idx_metal_rates_history_fetched_at ON metal_rates_history(fetched_at DESC);

-- Seed with placeholder values so pricing works before first API call
-- Admin must click "Update Metal Rates" to replace these with live data
INSERT INTO metal_rates (metal_type, price_per_gram, price_per_oz, currency, source, last_updated)
VALUES
  ('gold',   6500.0000, 202199.0000, 'INR', 'manual_seed', NOW()),
  ('silver',   80.0000,   2488.0000, 'INR', 'manual_seed', NOW())
ON CONFLICT (metal_type) DO NOTHING;

-- Add metal_rate_snapshot column to order_items for immutable price records
-- This freezes the gold/silver rate at the moment an order is placed
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS metal_rate_snapshot JSONB DEFAULT NULL;

-- Example metal_rate_snapshot value stored per order item:
-- {
--   "gold": { "price_per_gram": 6523.50, "currency": "INR", "last_updated": "2026-02-22T10:00:00Z" },
--   "silver": { "price_per_gram": 82.10, "currency": "INR", "last_updated": "2026-02-22T10:00:00Z" }
-- }
