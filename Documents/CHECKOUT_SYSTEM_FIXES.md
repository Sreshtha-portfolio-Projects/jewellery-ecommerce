# Checkout System Fixes – Single Reference

This document consolidates all checkout-fix documentation: quick deploy, root causes, technical details, testing, and troubleshooting.

---

## ⚡ Quick fix / deploy

1. **Run migration in Supabase SQL Editor:**  
   Copy and run `migrations/supabase-stock-management-fix.sql`.

2. **Deploy code:**  
   `git add . && git commit -m "Fix: Complete checkout system" && git push origin main`

3. Wait for Render to redeploy (about 2–5 minutes), then run through the test checklist below.

---

## ✅ What was fixed

| Issue | Status | File / change |
|-------|--------|----------------|
| Reviews won't load (500) | Fixed | `reviewController.js` – fetch user via auth.admin API |
| Cart add/update fails (500) | Fixed | `cartController.js` – improved upsert handling |
| Address creation fails (500) | Fixed | `addressController.js` – validation + error handling |
| Order intent fails (400) | Fixed | Handle products without variants |
| Cart–variant join error (500) | Fixed | `orderIntentController.js` – fetch variants separately |
| RLS blocking inserts (500) | Fixed | RLS disabled on `order_intents`, `inventory_locks`, `audit_logs`, `pricing_calculation_logs` |
| Payment verification / double deduction (500) | Fixed | `paymentController.js` / `orderIntentToOrderConverter.js` – single stock deduction |

**Files modified:**  
`migrations/supabase-stock-management-fix.sql`, `cartRevalidationService.js`, `orderIntentController.js`, `cartController.js`, `addressController.js`, `reviewController.js`, `paymentController.js`, `adminInventoryController.js`, `orderIntentToOrderConverter.js`.

---

## Root causes

1. **Cart–variant mismatch:** Cart had items without `variant_id`; validation assumed all items had variants → "Variant no longer exists".
2. **DB functions:** `decrement_stock()` (and related) only supported `product_variants`; products without variants caused 500s.
3. **Error handling:** Silent failures and generic errors made debugging hard.

---

## Solution overview

- **Database:** Universal stock functions (products + variants), better `inventory_locks`, lock release logic (`supabase-stock-management-fix.sql`).
- **Service:** `cartRevalidationService.js` – dual-path validation (variant vs product), universal stock checks, clearer errors.
- **Controllers:** Order intent with proper rollback and logging; cart, address, review, payment fixes as in the table above.

**Technical detail (stock):**  
Stock is now managed via `item_id` + `is_variant` (products and variants). Cart validation fetches variants and products in batches; inventory locks use `is_variant_lock`. Stock is deducted once (at lock/conversion), not twice.

---

## Test checklist

- [ ] Add to cart (with and without variant)
- [ ] Update / remove cart items
- [ ] Create / edit address
- [ ] View product reviews
- [ ] Proceed to checkout, create order intent
- [ ] Payment modal opens, complete test payment
- [ ] Order created, cart cleared, stock deducted once
- [ ] Inventory locks present and (after payment) converted

---

## Quick diagnosis

| Error | Where | Likely cause | Action |
|-------|--------|--------------|--------|
| "Cart is empty" (400) | Order intent | Cart validation | Ensure `cartRevalidationService.js` is deployed |
| "Failed to lock inventory" (500) | Order intent | DB functions | Run `supabase-stock-management-fix.sql` |
| "Variant no longer exists" (400) | Cart | Non-variant products | Code should handle both; confirm latest backend |
| "Error creating address" (500) | Address | Validation / RLS | Check `addressController.js` and RLS if re-enabled |
| "Function does not exist" | Any | Migration not run | Re-run `supabase-stock-management-fix.sql` |
| "Column is_variant_lock does not exist" | Locks | Incomplete migration | Re-run same migration |

---

## Monitoring

**Render logs – success:**  
`"Cart items found: X for user: ..."`, `"Order intent created successfully"`, `"Address created successfully"`.

**Render logs – failure:**  
`"Insufficient stock for..."`, `"Failed to lock inventory"`, `"Cart validation failed"`.

**Supabase:**  
Verify functions: `SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('decrement_stock', 'increment_stock', 'get_available_stock');`  
Inspect locks: `SELECT * FROM inventory_locks WHERE created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC LIMIT 10;`

---

## Common fixes

- **Still failing after deploy:** Empty commit to force redeploy: `git commit --allow-empty -m "Trigger redeploy" && git push origin main`. Wait 3–5 minutes.
- **Rollback:** `git log --oneline -5`, then `git revert <commit-hash>`, `git push origin main`.

---

## Success indicators

**Good:** No 400/500 on checkout path; orders complete; stock decrements once; locks created and converted.  
**Bad:** Repeated "Cart is empty"; "Function does not exist" in logs; stock not updating; many failed order attempts.

If issues persist after migration + deploy + cache clear + incognito test: check Render logs, Supabase logs, browser Network tab, and share the exact error message.
