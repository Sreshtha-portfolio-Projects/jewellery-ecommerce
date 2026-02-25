-- ============================================
-- QUICK CLEANUP: Orders, Customers & Analytics
-- ============================================
-- This script removes test orders and customer data
-- identified from the admin dashboard screenshots
--
-- Test Emails to Remove:
-- - sreshtha.form131@gmail.com
-- - sreshtha.mechlin@gmail.com
-- - priya@example.com
-- - ajay@example.com
-- - sneha@example.com
--
-- CAUTION: Review the email addresses before running!
-- Make sure these are truly test accounts and not real customers!
-- ============================================

-- ============================================
-- STEP 1: PREVIEW DATA TO BE DELETED
-- ============================================
-- Run this first to see what will be deleted

-- View test orders
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.payment_status,
  o.total_amount,
  COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
)
GROUP BY o.id, o.order_number, o.created_at, u.email, o.status, o.payment_status, o.total_amount
ORDER BY o.created_at DESC;

-- View test customers
SELECT 
  u.id,
  u.email,
  u.created_at,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_spent
FROM auth.users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
)
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Calculate total impact on analytics
SELECT 
  COUNT(o.id) as orders_to_delete,
  SUM(o.total_amount) as revenue_to_remove,
  COUNT(DISTINCT o.user_id) as customers_to_remove
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);

-- ============================================
-- STEP 2: DELETE TEST ORDERS AND RELATED DATA
-- ============================================
-- Only run this after reviewing Step 1 results!
-- Uncomment the DO block below to execute the deletion

/*
DO $$
DECLARE
  test_emails TEXT[] := ARRAY[
    'sreshtha.form131@gmail.com',
    'sreshtha.mechlin@gmail.com',
    'priya@example.com',
    'ajay@example.com',
    'sneha@example.com'
  ];
  test_user_id UUID;
  deleted_orders INTEGER := 0;
  total_deleted_orders INTEGER := 0;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Starting cleanup of test orders and data...';
  RAISE NOTICE '===========================================';
  
  -- Loop through each test email
  FOR test_user_id IN 
    SELECT id FROM auth.users 
    WHERE email = ANY(test_emails)
  LOOP
    -- Get user email for logging
    DECLARE
      user_email TEXT;
    BEGIN
      SELECT email INTO user_email FROM auth.users WHERE id = test_user_id;
      
      -- Count orders before deletion
      SELECT COUNT(*) INTO deleted_orders
      FROM orders 
      WHERE user_id = test_user_id;
      
      total_deleted_orders := total_deleted_orders + deleted_orders;
      
      RAISE NOTICE 'Processing user: % (ID: %)', user_email, test_user_id;
      RAISE NOTICE '  - Orders to delete: %', deleted_orders;
      
      -- Delete order-related data for this user
      DELETE FROM order_items 
      WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = test_user_id
      );
      RAISE NOTICE '  - Deleted order_items';
      
      DELETE FROM order_status_history
      WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = test_user_id
      );
      RAISE NOTICE '  - Deleted order_status_history';
      
      DELETE FROM payment_transactions
      WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = test_user_id
      );
      RAISE NOTICE '  - Deleted payment_transactions';
      
      DELETE FROM shipments
      WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = test_user_id
      );
      RAISE NOTICE '  - Deleted shipments';
      
      DELETE FROM inventory_locks
      WHERE order_intent_id IN (
        SELECT id FROM order_intents WHERE user_id = test_user_id
      );
      RAISE NOTICE '  - Deleted inventory_locks';
      
      DELETE FROM order_intents
      WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted order_intents';
      
      DELETE FROM orders WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted orders';
      
      -- Clean up user-related data
      DELETE FROM addresses WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted addresses';
      
      DELETE FROM carts WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted carts';
      
      DELETE FROM wishlists WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted wishlists';
      
      DELETE FROM product_reviews WHERE user_id = test_user_id;
      RAISE NOTICE '  - Deleted product_reviews';
      
      RAISE NOTICE '  ✓ Completed cleanup for %', user_email;
      RAISE NOTICE '';
    END;
  END LOOP;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CLEANUP SUMMARY';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total orders deleted: %', total_deleted_orders;
  RAISE NOTICE 'Total users processed: %', array_length(test_emails, 1);
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Delete user accounts from Supabase Auth';
  RAISE NOTICE 'Go to: Supabase Dashboard → Authentication → Users';
  RAISE NOTICE 'Search and delete the following emails:';
  
  FOR i IN 1..array_length(test_emails, 1) LOOP
    RAISE NOTICE '  - %', test_emails[i];
  END LOOP;
  
  RAISE NOTICE '===========================================';
END $$;
*/

-- ============================================
-- STEP 3: VERIFY CLEANUP
-- ============================================
-- Run these queries after Step 2 to verify the cleanup

-- Check remaining orders from test emails (should return 0 rows)
SELECT 
  o.order_number,
  u.email,
  o.total_amount,
  o.status
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);

-- Check total order count
SELECT COUNT(*) as total_remaining_orders FROM orders;

-- Check total revenue
SELECT 
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status IN ('paid', 'delivered');

-- Check for any test/dummy emails still in system
SELECT 
  u.email,
  u.created_at,
  COUNT(o.id) as order_count
FROM auth.users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.email LIKE '%@example.com%' 
   OR u.email LIKE '%test%' 
   OR u.email LIKE '%dummy%'
   OR u.email LIKE '%form131%'
   OR u.email LIKE '%mechlin%'
GROUP BY u.id, u.email, u.created_at;

-- ============================================
-- STEP 4: DELETE USER ACCOUNTS FROM SUPABASE AUTH
-- ============================================
-- This must be done via Supabase Dashboard or with proper permissions
--
-- METHOD 1: Via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Search for each email:
--    - sreshtha.form131@gmail.com
--    - sreshtha.mechlin@gmail.com
--    - priya@example.com
--    - ajay@example.com
--    - sneha@example.com
-- 3. Click the three dots menu → Delete User
-- 4. Confirm deletion
--
-- METHOD 2: Via SQL (only if you have admin privileges)
-- Uncomment the query below:

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
-- STEP 5: FINAL VERIFICATION
-- ============================================
-- Run this after deleting users from Supabase Auth

-- Verify no test users remain
SELECT COUNT(*) as remaining_test_users
FROM auth.users
WHERE email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);
-- Expected: 0

-- Check current system status
SELECT 
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('paid', 'delivered')) as total_revenue;

-- ============================================
-- ANALYTICS IMPACT
-- ============================================
-- After cleanup, your admin analytics will show:
-- 
-- ✓ Reduced/zero order count
-- ✓ Reduced/zero revenue figures
-- ✓ Reduced/zero customer count
-- ✓ Revenue by Metal Type will recalculate
-- ✓ Sales trends will reflect only real orders
--
-- This is expected and correct!
-- Your analytics will populate with real data as real customers place orders.
-- ============================================

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get foreign key errors, run these diagnostic queries:

-- Check what's still referencing a specific user
-- Replace 'USER_ID_HERE' with the actual user ID
/*
SELECT 'orders' as table_name, COUNT(*) as count 
FROM orders WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'carts', COUNT(*) FROM carts WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'wishlists', COUNT(*) FROM wishlists WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'product_reviews', COUNT(*) FROM product_reviews WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'order_intents', COUNT(*) FROM order_intents WHERE user_id = 'USER_ID_HERE';
*/

-- ============================================
-- END OF QUICK CLEANUP SCRIPT
-- ============================================
