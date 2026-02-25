# Cleanup Guide: Orders, Customers & Analytics Data

This guide will help you clean up test orders, customer accounts, and analytics data from your Aldorado Jewells e-commerce portal.

---

## 🎯 What This Guide Covers

Based on your admin dashboard, this guide will help you clean up:

1. **Test Orders** - Orders from test email addresses
2. **Test Customer Accounts** - Demo customer profiles
3. **Analytics Data** - Revenue and sales data (if needed)

---

## 📸 Data Identified for Cleanup

### Orders to Remove
From your Orders dashboard, these test orders were identified:
- `ORD-20251218-8742` - sreshtha.form131@gmail.com - ₹2,360 (PAID)
- `ORD-20251217-0290` - sreshtha.form131@gmail.com - ₹2,360 (PAID)
- `ORD-20251216-4389` - sreshtha.mechlin@gmail.com - ₹23,600 (PENDING)

### Customer Accounts to Remove
From your Customers dashboard, these test accounts were identified:
- Priya Sharma - priya@example.com - +91 9876543210
- Ajay Kumar - ajay@example.com - +91 9876543211
- Sneha Patel - sneha@example.com - +91 9876543212

### Analytics Data
Your analytics show:
- **Revenue by Metal Type**: Gold (45%), Diamond (35%), Silver (20%)
- **Online vs Offline Sales**: Monthly sales data
- **Sales Trends**: 7-month trend data

---

## 🔧 Method 1: Targeted Cleanup (Recommended)

This method removes ONLY test data while keeping the database structure intact.

### Step 1: Connect to Supabase SQL Editor

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Review Test Email Addresses

First, verify which users and orders will be deleted:

```sql
-- Check orders from test email addresses
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.payment_status,
  o.total_amount,
  COUNT(oi.id) as item_count
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
```

### Step 3: Delete Test Orders and Related Data

```sql
-- Delete orders and related data from test email addresses
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
BEGIN
  -- Loop through each test email
  FOR test_user_id IN 
    SELECT id FROM auth.users 
    WHERE email = ANY(test_emails)
  LOOP
    -- Count orders before deletion
    SELECT COUNT(*) INTO deleted_orders
    FROM orders 
    WHERE user_id = test_user_id;
    
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
    
    DELETE FROM order_intents
    WHERE user_id = test_user_id;
    
    DELETE FROM inventory_locks
    WHERE order_id IN (
      SELECT id FROM orders WHERE user_id = test_user_id
    );
    
    DELETE FROM orders WHERE user_id = test_user_id;
    
    -- Clean up user-related data
    DELETE FROM addresses WHERE user_id = test_user_id;
    DELETE FROM carts WHERE user_id = test_user_id;
    DELETE FROM wishlists WHERE user_id = test_user_id;
    DELETE FROM reviews WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Deleted % orders and related data for user ID: %', deleted_orders, test_user_id;
  END LOOP;
  
  RAISE NOTICE 'Cleanup complete!';
END $$;
```

### Step 4: Delete Test User Accounts

After cleaning the order data, delete the user accounts from Supabase Auth:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for each test email:
   - `sreshtha.form131@gmail.com`
   - `sreshtha.mechlin@gmail.com`
   - `priya@example.com`
   - `ajay@example.com`
   - `sneha@example.com`
3. Click the **three dots** menu next to each user
4. Select **Delete User**
5. Confirm the deletion

#### Option B: Via SQL (Advanced)
```sql
-- WARNING: This requires admin privileges
-- Only run if you have proper permissions

DELETE FROM auth.users 
WHERE email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);
```

### Step 5: Verify Cleanup

```sql
-- Check remaining orders
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.total_amount
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Check order count
SELECT COUNT(*) as total_orders FROM orders;

-- Check user count
SELECT COUNT(*) as total_users FROM auth.users;
```

**Expected Results:**
- No orders from test email addresses
- Test user accounts removed
- Only real customer orders remain (if any)

---

## 🔧 Method 2: Complete Reset (Nuclear Option)

⚠️ **WARNING**: This will delete ALL orders, customers, and related data!

Use this ONLY if you want to start completely fresh.

### Step 1: Backup Important Data

```sql
-- Backup products (if you want to keep them)
COPY (SELECT * FROM products) TO '/tmp/products_backup.csv' WITH CSV HEADER;

-- Backup metal rates
COPY (SELECT * FROM metal_rates) TO '/tmp/metal_rates_backup.csv' WITH CSV HEADER;
```

### Step 2: Delete All Transaction Data

```sql
-- Delete all order-related data
DELETE FROM order_items;
DELETE FROM order_status_history;
DELETE FROM payment_transactions;
DELETE FROM shipments;
DELETE FROM order_intents;
DELETE FROM inventory_locks;
DELETE FROM orders;

-- Delete all user-generated content
DELETE FROM addresses;
DELETE FROM carts;
DELETE FROM wishlists;
DELETE FROM reviews;

-- Delete audit logs (optional)
DELETE FROM audit_logs;

-- Verify
SELECT 
  'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'customers (auth.users)', COUNT(*) FROM auth.users;
```

### Step 3: Delete All Users from Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Select all users (or select test users individually)
3. Delete them via the dashboard

---

## 📊 Impact on Analytics

### After Targeted Cleanup (Method 1)
- Analytics will show **reduced** revenue and sales data
- Data from test orders will be removed
- Real customer orders (if any) will remain

### After Complete Reset (Method 2)
- Analytics will show **zero** revenue
- All charts will be empty:
  - Revenue by Metal Type: 0%
  - Online vs Offline Sales: No data
  - Sales Trends: Flat at 0

This is expected and correct for a fresh start.

---

## ✅ Verification Checklist

After running the cleanup, verify these areas:

### Admin Dashboard Verification

- [ ] **Orders Page** (`/admin/orders`)
  - [ ] No test orders visible
  - [ ] Order count is correct (0 or only real orders)
  
- [ ] **Customers Page** (`/admin/customers`)
  - [ ] No test customer accounts visible
  - [ ] Customer list shows only real customers (or empty)
  
- [ ] **Analytics Page** (`/admin/analytics`)
  - [ ] Revenue charts reflect actual data (or show 0)
  - [ ] Sales trends accurate or reset to 0
  - [ ] No inflated numbers from test orders

### Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- Should return 0 or only real orders
SELECT COUNT(*) as order_count FROM orders;

-- Should return 0 or only real customers
SELECT COUNT(*) as customer_count FROM auth.users;

-- Check for any remaining test emails
SELECT email FROM auth.users 
WHERE email LIKE '%@example.com%' 
   OR email LIKE '%test%' 
   OR email LIKE '%dummy%';

-- Check order items count
SELECT COUNT(*) as order_items_count FROM order_items;

-- Check total revenue (should match your expectations)
SELECT 
  SUM(total_amount) as total_revenue,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'paid' OR status = 'delivered';
```

---

## 🔄 After Cleanup: Next Steps

Once you've cleaned up the test data:

### 1. Update Admin Settings
- [ ] Review tax rates via `/admin/settings`
- [ ] Update shipping charges
- [ ] Configure return/refund policies

### 2. Prepare for Real Orders
- [ ] Test the checkout flow with real Razorpay account
- [ ] Verify email notifications are working
- [ ] Test order status updates
- [ ] Verify analytics tracking

### 3. Monitor First Real Orders
- [ ] Watch for real customer orders
- [ ] Verify analytics populate correctly
- [ ] Check order emails are sent
- [ ] Ensure payment processing works

---

## 🆘 Troubleshooting

### Issue: "Cannot delete orders - foreign key constraint"

**Cause**: Order items, payments, or shipments still reference the order

**Solution**: The cleanup script handles dependencies in the correct order:
1. Order items → Order status history → Payment transactions → Shipments
2. Inventory locks (via order_intents) → Order intents
3. Orders → User-related data

### Issue: "Column 'order_id' does not exist in inventory_locks"

**Cause**: The inventory_locks table uses `order_intent_id`, not `order_id`

**Solution**: ✅ Already fixed in the updated script! The correct deletion order is:
- First delete inventory_locks (by order_intent_id)
- Then delete order_intents
- Then delete orders

### Issue: "Cannot delete user - still has associated data"

**Cause**: User has orders, addresses, or other data still in the database

**Solution**: 
1. Run the order cleanup script first (Step 3)
2. Then delete the user accounts (Step 4)

### Issue: "Analytics still showing old data"

**Cause**: Browser cache or analytics cache

**Solution**:
1. Hard refresh the analytics page (Ctrl + Shift + R)
2. Clear browser cache
3. Wait 5-10 minutes for server cache to clear
4. Check if data is actually gone from database using verification queries

### Issue: "Some orders still visible in admin panel"

**Cause**: Orders from email addresses not in the cleanup list

**Solution**:
1. Run this query to find remaining test orders:
```sql
SELECT o.order_number, u.email, o.total_amount, o.status
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%dummy%'
   OR u.email LIKE '%@example.com';
```
2. Add those emails to the test_emails array in Step 3
3. Re-run the cleanup script

---

## 📝 Manual Cleanup Alternative

If you prefer manual cleanup via the Admin Dashboard:

### Delete Orders Manually
1. Go to `/admin/orders`
2. Click on each test order
3. Use the "Delete Order" button (if available)
4. Repeat for all test orders

⚠️ **Note**: This method may not clean up all related data (payments, shipments, etc.)

### Delete Customers Manually
1. Only possible via Supabase Dashboard → Authentication → Users
2. Cannot be done via the admin panel

---

## 📞 Need Help?

If you encounter issues:

1. **Check Error Logs**: Look at Supabase logs for detailed error messages
2. **Verify Permissions**: Ensure you're using the correct Supabase credentials
3. **Backup First**: Always backup before running destructive operations
4. **Test in Staging**: If possible, test cleanup scripts in a staging environment first

---

## 📋 Quick Reference

### Files Modified
- `migrations/cleanup-dummy-data.sql` - Main cleanup script (updated with order cleanup)

### Related Documentation
- `Documents/CLEANUP_GUIDE.md` - General cleanup guide
- `Documents/CLEANUP_CHECKLIST.md` - Full cleanup checklist
- `Documents/DUMMY_DATA_LOCATIONS.md` - Dummy data reference

---

**Last Updated**: February 25, 2026  
**Version**: 1.0
