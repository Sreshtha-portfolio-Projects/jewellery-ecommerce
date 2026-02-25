# Bug Fix: Inventory Locks Column Error

## Issue Fixed

**Error**: `column "order_id" does not exist in inventory_locks table`

**Root Cause**: The `inventory_locks` table uses `order_intent_id` (not `order_id`) as it's linked to order intents, not directly to orders.

## What Was Fixed

### Files Updated

1. **`migrations/quick-cleanup-orders-customers.sql`**
   - Fixed deletion order: Now deletes inventory_locks BEFORE order_intents
   - Changed: `WHERE order_id IN (...)` → `WHERE order_intent_id IN (...)`
   - Also fixed: `reviews` → `product_reviews` (correct table name)

2. **`migrations/cleanup-dummy-data.sql`**
   - Added missing order_intents and inventory_locks cleanup
   - Fixed deletion order for cascading deletes
   - Fixed table name: `reviews` → `product_reviews`

3. **`Documents/CLEANUP_ORDERS_CUSTOMERS_ANALYTICS.md`**
   - Added troubleshooting section explaining the fix
   - Documented correct deletion order

## Correct Database Relationship

```
orders
  └─ order_items
  └─ order_status_history
  └─ payment_transactions
  └─ shipments

order_intents
  └─ inventory_locks (linked via order_intent_id)

users (auth.users)
  └─ orders
  └─ order_intents
  └─ addresses
  └─ carts
  └─ wishlists
  └─ product_reviews
```

## Correct Deletion Order

To safely delete user data, the SQL script now follows this order:

```sql
-- 1. Delete order-related data (child tables first)
DELETE FROM order_items WHERE order_id IN (...);
DELETE FROM order_status_history WHERE order_id IN (...);
DELETE FROM payment_transactions WHERE order_id IN (...);
DELETE FROM shipments WHERE order_id IN (...);

-- 2. Delete inventory locks and order intents (order matters!)
DELETE FROM inventory_locks WHERE order_intent_id IN (...);
DELETE FROM order_intents WHERE user_id = ...;

-- 3. Delete orders
DELETE FROM orders WHERE user_id = ...;

-- 4. Clean up user data
DELETE FROM addresses WHERE user_id = ...;
DELETE FROM carts WHERE user_id = ...;
DELETE FROM wishlists WHERE user_id = ...;
DELETE FROM product_reviews WHERE user_id = ...;
```

## Status

✅ **FIXED** - Both SQL scripts now work correctly!

You can now run the cleanup script without errors.

---

**Fixed On**: February 25, 2026  
**Files Modified**: 3 files
