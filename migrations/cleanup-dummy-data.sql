-- ============================================
-- CLEANUP SCRIPT: Remove Dummy/Sample Data
-- ============================================
-- Run this script in Supabase SQL Editor to remove all sample data
-- CAUTION: This will delete sample products and reset certain tables
-- Make sure you have backups before running this script!

-- ============================================
-- 1. BACKUP CURRENT DATA (Optional but Recommended)
-- ============================================
-- Run these queries to save your current data before cleanup:
-- 
-- SELECT * FROM products; -- Copy to CSV
-- SELECT * FROM metal_rates; -- Copy to CSV

-- ============================================
-- 2. DELETE SAMPLE PRODUCTS
-- ============================================

-- Delete all products with Unsplash images (likely sample data)
DELETE FROM product_images 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE image_url LIKE '%unsplash.com%'
);

DELETE FROM product_variants 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE image_url LIKE '%unsplash.com%'
);

DELETE FROM products 
WHERE image_url LIKE '%unsplash.com%';

-- Or delete specific sample products by name
DELETE FROM product_images 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE name IN (
    'Solitaire Diamond Ring',
    'Gold Hoop Earrings',
    'Gold Triangle Stud Earrings',
    'Rose Gold Diamond Ring',
    'Rose Gold Pendant Necklace',
    'Princess Diamond Ring',
    'Butterfly Stud Earrings',
    'Swirl Diamond Ring',
    'Gold Bar Drop Earrings',
    'Gold Oval Hoop Earrings',
    'Pearl Bracelet',
    'Diamond Tennis Bracelet'
  )
);

DELETE FROM product_variants 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE name IN (
    'Solitaire Diamond Ring',
    'Gold Hoop Earrings',
    'Gold Triangle Stud Earrings',
    'Rose Gold Diamond Ring',
    'Rose Gold Pendant Necklace',
    'Princess Diamond Ring',
    'Butterfly Stud Earrings',
    'Swirl Diamond Ring',
    'Gold Bar Drop Earrings',
    'Gold Oval Hoop Earrings',
    'Pearl Bracelet',
    'Diamond Tennis Bracelet'
  )
);

DELETE FROM products 
WHERE name IN (
  'Solitaire Diamond Ring',
  'Gold Hoop Earrings',
  'Gold Triangle Stud Earrings',
  'Rose Gold Diamond Ring',
  'Rose Gold Pendant Necklace',
  'Princess Diamond Ring',
  'Butterfly Stud Earrings',
  'Swirl Diamond Ring',
  'Gold Bar Drop Earrings',
  'Gold Oval Hoop Earrings',
  'Pearl Bracelet',
  'Diamond Tennis Bracelet'
);

-- ============================================
-- 3. CLEAN UP ORPHANED DATA
-- ============================================

-- Remove cart items for deleted products
DELETE FROM carts 
WHERE product_id NOT IN (SELECT id FROM products);

-- Remove wishlist items for deleted products
DELETE FROM wishlists 
WHERE product_id NOT IN (SELECT id FROM products);

-- Remove reviews for deleted products
DELETE FROM reviews 
WHERE product_id NOT IN (SELECT id FROM products);

-- ============================================
-- 4. UPDATE METAL RATES (Mark for Update)
-- ============================================

-- Mark seed metal rates for update
UPDATE metal_rates 
SET 
  source = 'manual_seed_needs_update',
  last_updated = NOW()
WHERE source = 'manual_seed';

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check remaining products
SELECT COUNT(*) as remaining_products FROM products;

-- Check products by category
SELECT category, COUNT(*) as count 
FROM products 
GROUP BY category;

-- Check metal rates status
SELECT metal_type, price_per_gram, source, last_updated 
FROM metal_rates;

-- Check for any remaining Unsplash URLs
SELECT id, name, image_url 
FROM products 
WHERE image_url LIKE '%unsplash.com%';

-- ============================================
-- 6. OPTIONAL: CLEAN TEST ORDERS (Careful!)
-- ============================================
-- Uncomment only if you want to delete test orders
-- WARNING: This will delete ALL orders! Only use in development.

/*
-- Delete order-related data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM order_intents;
DELETE FROM inventory_locks;

-- Reset sequences if needed
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;
*/

-- ============================================
-- 7. OPTIONAL: CLEAN TEST USERS (Careful!)
-- ============================================
-- User management is handled by Supabase Auth
-- To remove test users, go to:
-- Supabase Dashboard > Authentication > Users
-- And manually delete test accounts

-- ============================================
-- 8. RESET ADMIN SETTINGS (Optional)
-- ============================================
-- Uncomment if you want to reset admin settings to defaults

/*
UPDATE admin_settings 
SET 
  value = CASE key
    WHEN 'tax_rate' THEN '18'
    WHEN 'shipping_charge' THEN '100'
    WHEN 'inventory_lock_duration' THEN '30'
    ELSE value
  END,
  updated_at = NOW();
*/

-- ============================================
-- END OF CLEANUP SCRIPT
-- ============================================

-- Final Status Report
SELECT 
  'Cleanup Complete' as status,
  (SELECT COUNT(*) FROM products) as remaining_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM metal_rates) as metal_rates_count;

-- NEXT STEPS:
-- 1. Add real products via Admin Dashboard (/admin/products)
-- 2. Update metal rates via Admin Dashboard (/admin/metal-rates)
-- 3. Replace frontend images with real product photography
-- 4. Add real customer testimonials or disable the component
