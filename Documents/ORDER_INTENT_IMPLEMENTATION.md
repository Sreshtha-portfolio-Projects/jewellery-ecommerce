# Order Intent, Inventory, Pricing & Admin Control Implementation

## Overview

This document describes the implementation of the pre-payment foundation system for Aldorado Jewells, including order intents, inventory locking, cart revalidation, pricing engine, coupon hardening, abandoned cart tracking, and admin operational controls.

## Database Schema

### New Tables

1. **admin_settings** - Central configuration system
   - Stores all configurable settings (tax, shipping, inventory lock duration, etc.)
   - Categories: pricing, tax, shipping, inventory, checkout
   - Types: string, number, boolean, json

2. **order_intents** - Order intent system
   - States: DRAFT → INTENT_CREATED → EXPIRED → CONVERTED → CANCELLED
   - Stores cart snapshot, pricing breakdown, discount info
   - Has expiry time (admin-configurable)

3. **inventory_locks** - Stock reservation system
   - Locks stock at variant level when order intent is created
   - Auto-releases on expiry
   - Status: LOCKED → RELEASED/EXPIRED/CONVERTED

4. **abandoned_carts** - Cart abandonment tracking
   - Tracks user carts with inactivity timeout
   - Status: ACTIVE → ABANDONED → RECOVERED → EXPIRED

5. **pricing_calculation_logs** - Audit trail for price calculations
   - Logs all pricing calculations for order intents

### Extended Tables

- **orders** - Added `order_intent_id` to link to order intent
- **discounts** - Added `locked_by_intent_id`, `locked_until`, `max_discount_amount`

### SQL Functions

- `increment_stock(variant_id, quantity)` - Increment variant stock
- `decrement_stock(variant_id, quantity)` - Decrement variant stock
- `release_expired_inventory_locks()` - Auto-release expired locks
- `expire_order_intents()` - Auto-expire order intents
- `mark_abandoned_carts()` - Mark carts as abandoned based on timeout

## Backend Implementation

### Services

1. **pricingEngine.js** - Pricing calculation engine
   - All calculations done server-side
   - No hardcoded values - everything from `admin_settings`
   - Calculates: subtotal, discount, tax, shipping, total
   - Supports dynamic pricing rules

2. **cartRevalidationService.js** - Cart validation engine
   - Validates cart before creating order intent
   - Checks: variant exists, stock available, price unchanged, discount valid
   - Returns validation result with errors/warnings

### Controllers

1. **orderIntentController.js**
   - `createOrderIntent` - Creates order intent from cart
   - `getOrderIntent` - Get order intent by ID
   - `getUserOrderIntents` - Get user's order intents
   - `cancelOrderIntent` - Cancel order intent (user or admin)

2. **adminSettingsController.js**
   - `getSettings` - Get all admin settings
   - `updateSetting` - Update single setting
   - `bulkUpdateSettings` - Bulk update settings

3. **adminInventoryController.js**
   - `getInventoryLocks` - Get all inventory locks
   - `getInventorySummary` - Get inventory summary
   - `releaseInventoryLock` - Manually release lock (admin)

4. **abandonedCartController.js**
   - `trackCartActivity` - Track cart activity
   - `getAbandonedCarts` - Get abandoned carts (admin)
   - `getAbandonedCartStats` - Get abandonment statistics

### Routes

- `/api/order-intents` - Order intent CRUD
- `/api/admin/settings` - Admin settings management
- `/api/admin/inventory` - Inventory management
- `/api/cart/activity` - Cart activity tracking
- `/api/admin/abandoned-carts` - Abandoned cart management

## Frontend Implementation

### Services

1. **orderIntentService.js** - Order intent API calls
2. **cartService.js** - Cart activity tracking
3. **adminService.js** - Extended with settings, inventory, abandoned carts

### Pages

1. **admin/Settings.jsx** - Admin settings management UI
   - Configure tax, shipping, inventory lock duration, etc.
   - Organized by category
   - Real-time updates

## Order Intent Flow

1. User clicks "Place Order" on checkout
2. Backend validates cart (revalidation engine)
3. If valid, creates order intent with:
   - Cart snapshot
   - Locked prices
   - Locked stock (inventory locks)
   - Locked discount code
   - Expiry time
4. Order intent expires after X minutes (admin-configurable)
5. On expiry, stock and discount are released
6. When payment succeeds (future), order intent is converted to order

## Inventory Locking

- Stock locked at variant level when order intent is created
- Lock duration is admin-configurable (default: 30 minutes)
- Auto-release on expiry
- Manual release available for admins
- Prevents overselling

## Pricing Engine

- **No hardcoded values** - Everything from `admin_settings`
- Calculates:
  - Subtotal (with dynamic pricing rules)
  - Discount (if coupon applied)
  - Tax (GST percentage from settings)
  - Shipping (free shipping threshold from settings)
  - Total
- All calculations logged for audit

## Cart Revalidation

Before creating order intent, backend validates:
- Variant exists and is active
- Stock available (considering locked inventory)
- Price unchanged
- Discount code still valid
- Checkout enabled (not in maintenance mode)

If validation fails, returns errors and forces cart refresh.

## Coupon Hardening

- Coupon locked when order intent is created
- Released if intent expires
- Validates:
  - Minimum cart value
  - Expiry date
  - Usage limits
  - Max discount cap (for percentage discounts)

## Abandoned Cart Tracking

- Tracks cart activity automatically
- Marks as abandoned after X minutes of inactivity (admin-configurable)
- Admin dashboard shows:
  - Abandoned cart count
  - Abandonment rate
  - Cart values
- Recovery campaigns can be added later

## Admin Operational Controls

Admin can:
- Cancel order intents
- Release locked stock manually
- Disable products instantly
- Freeze checkout globally (maintenance mode)
- Configure all settings via admin panel

All actions are logged in audit_logs.

## Security & Data Integrity

- Backend-only calculations
- Row-level validation
- Race-condition safe inventory locking
- Audit logs for all changes
- No hardcoded business logic

## Migration Instructions

1. Run `migrations/supabase-order-intent-inventory.sql` in Supabase SQL Editor
2. This will create all tables, functions, triggers, and RLS policies
3. Default settings will be inserted automatically

## Testing Checklist

- [ ] Create order intent from cart
- [ ] Validate cart before creating intent
- [ ] Test inventory locking
- [ ] Test order intent expiry
- [ ] Test coupon locking
- [ ] Test admin settings updates
- [ ] Test inventory lock release
- [ ] Test abandoned cart tracking
- [ ] Test maintenance mode
- [ ] Test pricing calculations with different settings

## Next Steps (Future)

- Payment integration (when ready)
- Courier APIs
- Email/WhatsApp notifications
- Auto recovery campaigns
- Order intent conversion to orders

## Notes

- All business logic is configurable via admin panel
- No magic numbers in code
- System is payment-ready
- No overselling possible
- Prices are consistent
- Admin controls everything

