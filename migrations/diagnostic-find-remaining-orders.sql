-- ============================================
-- DIAGNOSTIC: Find Which Users Still Have Orders
-- ============================================
-- Run this to see which users are causing analytics data to remain
-- ============================================

-- Show all users with orders
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  STRING_AGG(o.order_number, ', ') as order_numbers
FROM auth.users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;

-- Show all orders with user details
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  u.email,
  u.id as user_id,
  o.status,
  o.payment_status,
  o.total_amount,
  o.is_online_order,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- Check if orders belong to test emails
SELECT 
  'Test emails' as category,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
)
UNION ALL
SELECT 
  'Other emails' as category,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email NOT IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
)
OR u.email IS NULL;

-- Check for orders with NULL or deleted users
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  o.total_amount,
  o.status,
  CASE 
    WHEN u.id IS NULL THEN 'USER DELETED (orphaned order)'
    ELSE u.email
  END as user_status
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- ============================================
-- ANALYSIS: Why Analytics Still Show Data
-- ============================================
-- Your analytics dashboard queries the orders table
-- If you still see data in analytics, it means:
-- 1. Orders still exist in the database
-- 2. These orders are counted in revenue calculations
-- 
-- The queries above will help you identify:
-- - Which users still have orders
-- - Which email addresses those orders belong to
-- - If there are orphaned orders (user deleted but order remains)
-- ============================================

-- ============================================
-- SOLUTION OPTIONS
-- ============================================

-- OPTION 1: Delete specific remaining orders by order number
-- (Replace ORDER_NUMBER with actual order numbers from the query above)
/*
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE order_number IN ('ORD-XXXXXXXX-XXXX', 'ORD-XXXXXXXX-XXXX')
);
DELETE FROM order_status_history WHERE order_id IN (
  SELECT id FROM orders WHERE order_number IN ('ORD-XXXXXXXX-XXXX', 'ORD-XXXXXXXX-XXXX')
);
DELETE FROM payment_transactions WHERE order_id IN (
  SELECT id FROM orders WHERE order_number IN ('ORD-XXXXXXXX-XXXX', 'ORD-XXXXXXXX-XXXX')
);
DELETE FROM shipments WHERE order_id IN (
  SELECT id FROM orders WHERE order_number IN ('ORD-XXXXXXXX-XXXX', 'ORD-XXXXXXXX-XXXX')
);
DELETE FROM orders WHERE order_number IN ('ORD-XXXXXXXX-XXXX', 'ORD-XXXXXXXX-XXXX');
*/

-- OPTION 2: Delete ALL orders (complete reset)
-- Use the complete-reset-all-orders-analytics.sql script instead
-- (Safer and more comprehensive)

-- ============================================
-- VERIFICATION AFTER CLEANUP
-- ============================================

-- Should return 0 for everything
SELECT 
  (SELECT COUNT(*) FROM orders) as remaining_orders,
  (SELECT COUNT(*) FROM order_items) as remaining_order_items,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as remaining_revenue;

-- Expected: All zeros

-- ============================================
-- REFRESH ADMIN DASHBOARD
-- ============================================
-- After cleanup:
-- 1. Hard refresh the analytics page (Ctrl + Shift + R)
-- 2. Clear browser cache if needed
-- 3. Wait 30 seconds for any server-side cache to clear
-- 4. Check /admin/analytics again
--
-- You should see:
-- ✓ Revenue by Metal Type: "No data available"
-- ✓ Online vs Offline Sales: All bars at 0
-- ✓ Sales Trend: Flat line at 0
-- ============================================
