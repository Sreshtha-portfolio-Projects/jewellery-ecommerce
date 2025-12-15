-- Product Features Extensions
-- Run this SQL in your Supabase SQL Editor
-- Adds: Multiple images, Reviews, Product pairing, Delivery zones

-- ============================================
-- 1. PRODUCT IMAGES TABLE (Multiple images per product)
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);

-- Migrate existing image_url to product_images
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, image_url, true, 0
FROM products
WHERE image_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id) -- One review per user per product
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(product_id, rating);

-- ============================================
-- 3. PRODUCT PAIRING TABLE (You may also like)
-- ============================================
CREATE TABLE IF NOT EXISTS product_pairings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  paired_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pairing_type VARCHAR(50) DEFAULT 'related', -- 'related', 'complementary', 'similar', 'bought_together'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, paired_product_id) -- Prevent duplicate pairings
);

CREATE INDEX IF NOT EXISTS idx_pairings_product ON product_pairings(product_id);
CREATE INDEX IF NOT EXISTS idx_pairings_paired ON product_pairings(paired_product_id);

-- ============================================
-- 4. DELIVERY ZONES TABLE (Pincode-based delivery)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pincode VARCHAR(10) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 5, -- Estimated delivery days
  is_available BOOLEAN DEFAULT TRUE,
  shipping_charge DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_pincode ON delivery_zones(pincode);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_city ON delivery_zones(city);

-- Insert some common Indian pincodes
INSERT INTO delivery_zones (pincode, city, state, delivery_days, shipping_charge) VALUES
('110001', 'New Delhi', 'Delhi', 3, 0),
('400001', 'Mumbai', 'Maharashtra', 4, 0),
('560001', 'Bangalore', 'Karnataka', 4, 0),
('600001', 'Chennai', 'Tamil Nadu', 5, 0),
('700001', 'Kolkata', 'West Bengal', 5, 0),
('380001', 'Ahmedabad', 'Gujarat', 4, 0),
('411001', 'Pune', 'Maharashtra', 4, 0),
('302001', 'Jaipur', 'Rajasthan', 5, 0)
ON CONFLICT (pincode) DO NOTHING;

-- ============================================
-- 5. PRODUCT OFFERS TABLE (Discounts/Offers per product)
-- ============================================
CREATE TABLE IF NOT EXISTS product_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  offer_type VARCHAR(50) DEFAULT 'discount', -- 'discount', 'bogo', 'cashback'
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  offer_text VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_product ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON product_offers(is_active, valid_until);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public product images are viewable by everyone" ON product_images;
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON product_reviews;
DROP POLICY IF EXISTS "Public pairings are viewable by everyone" ON product_pairings;
DROP POLICY IF EXISTS "Public delivery zones are viewable by everyone" ON delivery_zones;
DROP POLICY IF EXISTS "Public offers are viewable by everyone" ON product_offers;
DROP POLICY IF EXISTS "Users can create their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON product_reviews;

-- RLS Policies: Public read access
CREATE POLICY "Public product images are viewable by everyone"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Public reviews are viewable by everyone"
  ON product_reviews FOR SELECT
  USING (true);

CREATE POLICY "Public pairings are viewable by everyone"
  ON product_pairings FOR SELECT
  USING (true);

CREATE POLICY "Public delivery zones are viewable by everyone"
  ON delivery_zones FOR SELECT
  USING (true);

CREATE POLICY "Public offers are viewable by everyone"
  ON product_offers FOR SELECT
  USING (true);

-- RLS Policies: Users can create their own reviews
CREATE POLICY "Users can create their own reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

