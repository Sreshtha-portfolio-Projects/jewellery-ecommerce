-- ============================================
-- Check if Stock Management Functions Exist
-- Run this in Supabase SQL Editor
-- ============================================

-- METHOD 1: Simple check (just names)
SELECT proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('decrement_stock', 'increment_stock')
AND n.nspname = 'public';

-- Expected: 2 rows (decrement_stock, increment_stock)
-- If 0 rows: Functions don't exist → Run migration!

-- ============================================

-- METHOD 2: Check with parameters (more detailed)
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('decrement_stock', 'increment_stock')
AND n.nspname = 'public';

-- Expected for NEW functions:
-- decrement_stock | item_id uuid, quantity integer, is_variant boolean DEFAULT true | void
-- increment_stock | item_id uuid, quantity integer, is_variant boolean DEFAULT true | void

-- Expected for OLD functions (need update):
-- decrement_stock | variant_id uuid, quantity integer | void
-- increment_stock | variant_id uuid, quantity integer | void

-- ============================================

-- METHOD 3: Check inventory_locks column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_locks'
AND column_name = 'is_variant_lock';

-- Expected: 1 row showing is_variant_lock | boolean | true
-- If 0 rows: Column doesn't exist → Run migration!

-- ============================================
-- QUICK DECISION GUIDE
-- ============================================

-- IF METHOD 1 returns 0 rows:
--   → Functions don't exist at all
--   → RUN FULL MIGRATION NOW ✅

-- IF METHOD 2 shows "variant_id" (not "item_id"):
--   → Old functions exist (variant-only)
--   → RUN FULL MIGRATION NOW ✅

-- IF METHOD 2 shows "item_id" AND "is_variant":
--   → New universal functions exist
--   → Check METHOD 3 for column

-- IF METHOD 3 returns 0 rows:
--   → Column missing
--   → RUN FULL MIGRATION NOW ✅

-- IF ALL CHECKS PASS:
--   → ✅ Everything is perfect! No action needed.
