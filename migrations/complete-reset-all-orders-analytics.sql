-- ============================================
-- COMPLETE RESET: All Orders & Analytics Data
-- ============================================
-- This script will DELETE ALL orders and user-generated data
-- This will reset your analytics to ZERO
-- 
-- ⚠️ WARNING: This is a NUCLEAR OPTION - it deletes EVERYTHING!
-- ⚠️ Only use this if you want a completely fresh start
-- ⚠️ Make sure you have backups before running!
-- ============================================

-- ============================================
-- STEP 1: BACKUP (DO THIS FIRST!)
-- ============================================
-- Run these queries and save the results before proceeding

-- Backup orders
-- Copy this result to a CSV file
/*
SELECT * FROM orders ORDER BY created_at DESC;
SELECT * FROM order_items ORDER BY created_at DESC;
*/

-- ============================================
-- STEP 2: PREVIEW WHAT WILL BE DELETED
-- ============================================
-- Run this first to see the impact

-- View all orders that will be deleted
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.payment_status,
  o.total_amount,
  o.is_online_order
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- Summary of what will be deleted
SELECT 
  COUNT(*) as total_orders_to_delete,
  SUM(total_amount) as total_revenue_to_remove,
  COUNT(DISTINCT user_id) as users_with_orders,
  COUNT(DISTINCT CASE WHEN is_online_order = true THEN id END) as online_orders,
  COUNT(DISTINCT CASE WHEN is_online_order = false THEN id END) as offline_orders
FROM orders;

-- Count related data that will be deleted
SELECT 
  (SELECT COUNT(*) FROM order_items) as order_items_to_delete,
  (SELECT COUNT(*) FROM order_status_history) as status_history_to_delete,
  (SELECT COUNT(*) FROM payment_transactions) as payment_transactions_to_delete,
  (SELECT COUNT(*) FROM shipments) as shipments_to_delete,
  (SELECT COUNT(*) FROM order_intents) as order_intents_to_delete,
  (SELECT COUNT(*) FROM inventory_locks) as inventory_locks_to_delete;

-- ============================================
-- STEP 3: DELETE ALL ORDERS AND ANALYTICS DATA
-- ============================================
-- ⚠️ POINT OF NO RETURN - Uncomment to execute deletion
-- Remove the /* and */ comments below to run

/*
DO $$
DECLARE
  deleted_orders INTEGER;
  deleted_items INTEGER;
  total_revenue DECIMAL(10,2);
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'STARTING COMPLETE ORDER & ANALYTICS RESET';
  RAISE NOTICE '===========================================';
  
  -- Get counts before deletion
  SELECT COUNT(*), SUM(total_amount) INTO deleted_orders, total_revenue
  FROM orders;
  
  SELECT COUNT(*) INTO deleted_items FROM order_items;
  
  RAISE NOTICE 'About to delete:';
  RAISE NOTICE '  - Orders: %', deleted_orders;
  RAISE NOTICE '  - Order Items: %', deleted_items;
  RAISE NOTICE '  - Total Revenue: ₹%', total_revenue;
  RAISE NOTICE '';
  
  -- Delete in correct order (respecting foreign key constraints)
  
  -- 1. Delete order items (references orders)
  DELETE FROM order_items;
  RAISE NOTICE '✓ Deleted all order_items';
  
  -- 2. Delete order status history (references orders)
  DELETE FROM order_status_history;
  RAISE NOTICE '✓ Deleted all order_status_history';
  
  -- 3. Delete payment transactions (references orders)
  DELETE FROM payment_transactions;
  RAISE NOTICE '✓ Deleted all payment_transactions';
  
  -- 4. Delete shipments (references orders)
  DELETE FROM shipments;
  RAISE NOTICE '✓ Deleted all shipments';
  
  -- 5. Delete inventory locks (references order_intents)
  DELETE FROM inventory_locks;
  RAISE NOTICE '✓ Deleted all inventory_locks';
  
  -- 6. Delete order intents
  DELETE FROM order_intents;
  RAISE NOTICE '✓ Deleted all order_intents';
  
  -- 7. Delete all orders
  DELETE FROM orders;
  RAISE NOTICE '✓ Deleted all orders';
  
  -- 8. Delete all user-generated content (optional - uncomment if needed)
  -- DELETE FROM addresses;
  -- RAISE NOTICE '✓ Deleted all addresses';
  
  -- DELETE FROM carts;
  -- RAISE NOTICE '✓ Deleted all carts';
  
  -- DELETE FROM wishlists;
  -- RAISE NOTICE '✓ Deleted all wishlists';
  
  -- DELETE FROM product_reviews;
  -- RAISE NOTICE '✓ Deleted all product_reviews';
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RESET COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Orders deleted: %', deleted_orders;
  RAISE NOTICE 'Revenue removed: ₹%', total_revenue;
  RAISE NOTICE '';
  RAISE NOTICE 'Your analytics are now reset to zero!';
  RAISE NOTICE '===========================================';
END $$;
*/

-- ============================================
-- STEP 4: VERIFY COMPLETE RESET
-- ============================================
-- Run this after Step 3 to verify everything is clean

-- Should all return 0
SELECT 
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM order_items) as order_items_count,
  (SELECT COUNT(*) FROM order_status_history) as status_history_count,
  (SELECT COUNT(*) FROM payment_transactions) as payment_transactions_count,
  (SELECT COUNT(*) FROM shipments) as shipments_count,
  (SELECT COUNT(*) FROM order_intents) as order_intents_count,
  (SELECT COUNT(*) FROM inventory_locks) as inventory_locks_count;

-- Check revenue (should be 0)
SELECT 
  COUNT(*) as order_count,
  COALESCE(SUM(total_amount), 0) as total_revenue,
  COALESCE(AVG(total_amount), 0) as avg_order_value
FROM orders;

-- ============================================
-- STEP 5: ANALYTICS VERIFICATION
-- ============================================
-- After cleanup, check your admin dashboard:

-- Revenue by Metal Type - Should show 0% or "No data"
-- Check this query returns no rows:
SELECT 
  COALESCE(p.metal_type, 'Unknown') as metal_type,
  SUM(oi.subtotal) as revenue,
  COUNT(DISTINCT o.id) as order_count
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status IN ('paid', 'delivered')
GROUP BY p.metal_type
ORDER BY revenue DESC;

-- Online vs Offline Sales - Should show 0
SELECT 
  COALESCE(is_online_order, true) as is_online,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue
FROM orders
WHERE status IN ('paid', 'delivered')
GROUP BY is_online_order;

-- Sales Trend - Should show no data
SELECT 
  DATE_TRUNC('day', created_at) as order_date,
  COUNT(*) as orders,
  SUM(total_amount) as revenue
FROM orders
WHERE status IN ('paid', 'delivered')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY order_date;

-- ============================================
-- STEP 6: OPTIONAL - DELETE TEST USERS
-- ============================================
-- After orders are deleted, remove test user accounts
-- This must be done via Supabase Dashboard:
-- 
-- 1. Go to: Supabase Dashboard → Authentication → Users
-- 2. Search for and delete:
--    - sreshtha.form131@gmail.com
--    - sreshtha.mechlin@gmail.com
--    - priya@example.com
--    - ajay@example.com
--    - sneha@example.com
-- 
-- Or use SQL (if you have permissions):
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
-- STEP 7: FINAL SYSTEM STATUS
-- ============================================

SELECT 
  'System Reset Complete' as status,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM auth.users) as users_count,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue;

-- Expected results after complete reset:
-- products_count: 1 (or however many real products you have)
-- orders_count: 0
-- users_count: 0-3 (depends if you deleted test users)
-- total_revenue: 0.00

-- ============================================
-- WHAT TO EXPECT IN ADMIN DASHBOARD
-- ============================================
-- After running this script:
--
-- ✓ /admin/orders - Will show "No orders found" or empty table
-- ✓ /admin/customers - Will show 0 or only real customers
-- ✓ /admin/analytics - All charts will show 0 or "No data"
--   - Revenue by Metal Type: No data available
--   - Online vs Offline Sales: All bars at 0
--   - Sales Trend: Flat line at 0
--
-- This is CORRECT and EXPECTED for a fresh start!
-- Your analytics will populate with real data as real customers place orders.
-- ============================================

-- ============================================
-- ROLLBACK (If something goes wrong)
-- ============================================
-- If you need to restore, use your backup from Step 1
-- Or restore from a Supabase backup if you have one
-- ============================================
