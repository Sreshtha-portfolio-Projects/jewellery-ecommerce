-- Supabase Database Setup for Poor Gem E-commerce
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url TEXT,
  is_bestseller BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_bestseller);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access to products
CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- RLS Policy: Only service role can insert/update/delete (handled by backend)
-- The backend uses service role key, so it bypasses RLS

-- Insert sample products
INSERT INTO products (name, price, category, image_url, is_bestseller, description) VALUES
  ('Solitaire Diamond Ring', 1200.00, 'rings', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', true, 'Classic solitaire diamond ring in 14k gold'),
  ('Gold Hoop Earrings', 350.00, 'earrings', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', true, 'Elegant gold hoop earrings'),
  ('Gold Triangle Stud Earrings', 450.00, 'earrings', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', true, 'Modern triangle stud earrings'),
  ('Rose Gold Diamond Ring', 950.00, 'rings', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', true, 'Beautiful rose gold ring with diamonds'),
  ('Rose Gold Pendant Necklace', 650.00, 'necklaces', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', true, 'Delicate pendant necklace'),
  ('Princess Diamond Ring', 1100.00, 'rings', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', true, 'Princess cut diamond ring'),
  ('Butterfly Stud Earrings', 280.00, 'earrings', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', true, 'Charming butterfly stud earrings'),
  ('Swirl Diamond Ring', 1300.00, 'rings', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', true, 'Unique swirl design diamond ring'),
  ('Gold Bar Drop Earrings', 420.00, 'earrings', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', false, 'Sophisticated bar drop earrings'),
  ('Gold Oval Hoop Earrings', 380.00, 'earrings', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', false, 'Elegant oval hoop earrings'),
  ('Pearl Bracelet', 550.00, 'bracelets', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', false, 'Classic pearl bracelet'),
  ('Diamond Tennis Bracelet', 1800.00, 'bracelets', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', false, 'Luxurious diamond tennis bracelet');

-- Note: Admin users are managed through Supabase Auth
-- Create admin users through Supabase Dashboard > Authentication > Users
-- Or use the Supabase Auth API to create users with email/password

