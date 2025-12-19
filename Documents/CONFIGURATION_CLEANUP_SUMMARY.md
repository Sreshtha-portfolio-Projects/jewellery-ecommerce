# Configuration Cleanup Summary

## ✅ COMPLETED

### 1. **Config Service Created** (`backend/src/services/configService.js`)
- Central service for all business rules
- Reads from `admin_settings` table
- Intelligent caching (1-minute TTL)
- Provides methods for:
  - Order status transitions
  - Shipping status transitions
  - Return status transitions
  - All other business rule settings

### 2. **State Machines Moved to Database**
- **Order Status Transitions**: Now in `admin_settings` as JSON
- **Shipping Status Transitions**: Now in `admin_settings` as JSON
- **Return Status Transitions**: Now in `admin_settings` as JSON
- Migration file: `migrations/add-state-machine-configs.sql`

### 3. **Controllers Updated**
- `orderController.js`: Uses `configService.validateOrderTransition()`
- `adminShippingController.js`: Uses `configService.validateShippingTransition()` and `getNextShippingStatuses()`
- `returnController.js`: Uses `configService.validateReturnTransition()`
- All hardcoded state machines removed

### 4. **Cache Management**
- `adminSettingsController.js`: Clears config cache when settings are updated
- Ensures changes take effect immediately

### 5. **Existing Configurations** (Already in place)
- Tax percentage: `tax_percentage` (default: 18%)
- Shipping charge: `shipping_charge` (default: 0)
- Free shipping threshold: `free_shipping_threshold` (default: 5000)
- Return window: `return_window_days` (default: 7)
- Delivery days: `delivery_days_min` and `delivery_days_max` (default: 3-5)

## ⚠️ KNOWN ISSUE

### Frontend Price Preview Calculation
**Location**: `frontend/src/pages/Checkout.jsx` (lines 59-79)

**Issue**: Frontend calculates tax and shipping for preview display:
```javascript
const tax = afterDiscount * 0.18; // 18% GST (hardcoded)
const shipping = 0; // Free shipping (hardcoded)
```

**Impact**: 
- This is only for **display preview** before order intent creation
- **Actual order pricing** is calculated by backend (`pricingEngine`) when order intent is created
- The displayed values may not match final order values if config changes

**Recommendation**:
- Option 1: Create a pricing preview endpoint (`GET /api/pricing/preview`) that returns breakdown without creating order intent
- Option 2: Accept the minor discrepancy (preview vs actual) since actual pricing is always correct
- Option 3: Remove preview calculation and show "Calculating..." until order intent is created

**Note**: This does not affect actual order pricing - all real calculations are done server-side.

## 📋 ADMIN CONFIGURATION

### How to Update Business Rules

1. **Via Admin Panel**:
   - Navigate to `/admin/settings`
   - Find the category (orders, shipping, returns, pricing, tax)
   - Update values as needed
   - Changes take effect immediately (cache cleared)

2. **Via API**:
   ```bash
   PUT /api/admin/settings/{key}
   Body: { "value": "new_value" }
   ```

3. **State Machine Updates**:
   - State machines are stored as JSON in `admin_settings`
   - Key: `order_status_transitions`, `shipping_status_transitions`, `return_status_transitions`
   - Format: `{"STATUS": ["next_status1", "next_status2"]}`
   - Example: `{"pending": ["paid", "cancelled"]}`

## ✅ SUCCESS CRITERIA MET

- ✅ **No hardcoded business rules in backend** (except fallback defaults)
- ✅ **One source of truth**: `admin_settings` table
- ✅ **Config changes don't require code changes**
- ✅ **Admin can view/update all business rules**
- ✅ **Backend reads values dynamically**
- ⚠️ **Frontend has preview calculation** (but actual pricing is server-side)

## 🔄 MIGRATION INSTRUCTIONS

Run the migration to add state machine configs:

```sql
-- Run in Supabase SQL Editor
\i migrations/add-state-machine-configs.sql
```

Or manually execute the SQL from `migrations/add-state-machine-configs.sql`

## 📝 NOTES

1. **Default Values**: All config methods have sensible defaults that match previous hardcoded values. These are only used if database setting is missing.

2. **Cache**: Config service caches values for 1 minute. Cache is automatically cleared when settings are updated via admin panel.

3. **State Machines**: Can be updated via admin panel by editing the JSON value. Changes take effect immediately.

4. **Validation**: All state transitions are validated using config service. Invalid transitions are rejected.

5. **Backward Compatibility**: Existing code continues to work. State machines default to previous hardcoded values if config is missing.
