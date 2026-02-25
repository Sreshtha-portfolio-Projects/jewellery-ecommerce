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
DELETE FROM product_reviews 
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
-- 6. CLEAN TEST ORDERS (Based on Test Emails)
-- ============================================
-- This will delete orders from specific test email addresses
-- CAUTION: Review the email addresses before running!

-- List of test email addresses to remove
-- Modify this list to match your test accounts
DO $$
DECLARE
  test_emails TEXT[] := ARRAY[
    'sreshtha.form131@gmail.com',
    'sreshtha.mechlin@gmail.com'
  ];
  test_user_id UUID;
BEGIN
  -- Loop through each test email
  FOR test_user_id IN 
    SELECT id FROM auth.users 
    WHERE email = ANY(test_emails)
  LOOP
    -- Delete order-related data for this user
    DELETE FROM order_items 
    WHERE order_id IN (
      SELECT id FROM orders WHERE user_id = test_user_id
    );
    
    DELETE FROM order_status_history
    WHERE order_id IN (
      SELECT id FROM orders WHERE user_id = test_user_id
    );
    
    DELETE FROM payment_transactions
    WHERE order_id IN (
      SELECT id FROM orders WHERE user_id = test_user_id
    );
    
    DELETE FROM shipments
    WHERE order_id IN (
      SELECT id FROM orders WHERE user_id = test_user_id
    );
    
    DELETE FROM inventory_locks
    WHERE order_intent_id IN (
      SELECT id FROM order_intents WHERE user_id = test_user_id
    );
    
    DELETE FROM order_intents
    WHERE user_id = test_user_id;
    
    DELETE FROM orders WHERE user_id = test_user_id;
    
    -- Clean up user-related data
    DELETE FROM addresses WHERE user_id = test_user_id;
    DELETE FROM carts WHERE user_id = test_user_id;
    DELETE FROM wishlists WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Deleted data for user: %', test_user_id;
  END LOOP;
END $$;

-- Verify remaining orders
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.payment_status,
  o.total_amount
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================
-- 7. CLEAN TEST USERS FROM AUTH (Manual Step)
-- ============================================
-- User management is handled by Supabase Auth
-- After cleaning order data, delete test users via:
-- 
-- Method 1: Supabase Dashboard
-- - Go to: Supabase Dashboard > Authentication > Users
-- - Search for test emails and delete them manually
--
-- Method 2: SQL (if you have proper permissions)
/*
DELETE FROM auth.users 
WHERE email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);
*/

-- ============================================
-- 8. CLEAN ALL ANALYTICS/SALES DATA (Optional)
-- ============================================
-- Uncomment ONLY if you want to completely reset the system
-- This will remove ALL orders and user data (not just test data)

/*
-- Delete all order-related data
DELETE FROM order_items;
DELETE FROM order_status_history;
DELETE FROM payment_transactions;
DELETE FROM shipments;
DELETE FROM inventory_locks;
DELETE FROM order_intents;
DELETE FROM orders;

-- Delete all user-generated content
DELETE FROM addresses;
DELETE FROM carts;
DELETE FROM wishlists;
DELETE FROM product_reviews;

-- Note: This does NOT delete users from auth.users
-- You must do that separately in Supabase Dashboard
*/

-- ============================================
-- 9. RESET ADMIN SETTINGS (Optional)
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
