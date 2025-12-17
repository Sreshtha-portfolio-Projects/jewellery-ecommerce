# 🔍 Final Database Verification

## Check if Universal Stock Functions Exist

Run this in **Supabase SQL Editor**:

```sql
-- Check if universal functions exist
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name IN ('decrement_stock', 'increment_stock')
AND routine_schema = 'public';
```

### Expected Results:

**If functions are CORRECT:**
- You'll see `decrement_stock` with parameters: `item_id UUID, quantity INTEGER, is_variant BOOLEAN`
- You'll see `increment_stock` with same parameters

**If functions are OLD (need update):**
- You'll see `decrement_stock` with parameters: `variant_id UUID, quantity INTEGER` (no `is_variant`)
- You'll see `increment_stock` with same old parameters

---

## If Functions Need Update

Run this entire SQL file in **Supabase SQL Editor**:

**File:** `migrations/supabase-stock-management-fix.sql`

Copy the entire contents and run it. This will:
1. Drop old variant-only functions
2. Create new universal functions (products + variants)
3. Add `is_variant_lock` column to `inventory_locks` table
4. Update the expired lock cleanup function

---

## Check inventory_locks Table

Run this to see if `is_variant_lock` column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_locks'
AND column_name = 'is_variant_lock';
```

**Expected:** One row showing `is_variant_lock | boolean | YES`

**If empty:** The migration hasn't been run yet

---

## Quick Test Query

After ensuring functions exist, test them:

```sql
-- Test the function signature (won't actually modify data)
SELECT decrement_stock(
    'ec137ef9-0ddd-411b-b91a-59ed21b5f13d'::UUID,  -- Any UUID
    1,
    true
);
```

**Expected:** Should complete without error (even if UUID doesn't exist)

**If error:** "function decrement_stock(uuid, integer, boolean) does not exist" → Need to run migration

---

## Summary

| Item | Check | Action if Missing |
|------|-------|-------------------|
| Universal `decrement_stock` | Query info schema | Run migration SQL |
| Universal `increment_stock` | Query info schema | Run migration SQL |
| `is_variant_lock` column | Query columns | Run migration SQL |
| RLS disabled | ✅ Already done | None |

---

## Current Status

Since your **payment and orders are working**, one of two things is true:

1. ✅ **Migration already run** - Functions exist, everything perfect
2. ⚠️ **Functions don't exist yet** - System working but could have issues with:
   - Products without variants (future orders)
   - Inventory lock cleanup (background job)
   - Manual lock releases (admin panel)

**Recommendation:** Run the check queries above to be 100% sure everything is perfect! 🎯
