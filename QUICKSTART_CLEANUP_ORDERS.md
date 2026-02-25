# Quick Start: Cleaning Orders, Customers & Analytics Data

This is a quick reference guide for removing test orders and customer data from your Aldorado Jewells admin dashboard.

---

## 🎯 What You Need to Clean

Based on your screenshots, you have:

### Test Orders (3)
- `ORD-20251218-8742` - sreshtha.form131@gmail.com - ₹2,360
- `ORD-20251217-0290` - sreshtha.form131@gmail.com - ₹2,360  
- `ORD-20251216-4389` - sreshtha.mechlin@gmail.com - ₹23,600

### Test Customers (3)
- Priya Sharma - priya@example.com
- Ajay Kumar - ajay@example.com
- Sneha Patel - sneha@example.com

### Analytics Data
- Revenue by Metal Type: Gold (45%), Diamond (35%), Silver (20%)
- Online vs Offline Sales trends
- All will reset to zero or show only real data after cleanup

---

## ⚡ Quick Cleanup (3 Steps)

### Step 1: Run SQL Script (5 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open the file: `migrations/quick-cleanup-orders-customers.sql`
3. **IMPORTANT**: Review the test email addresses in the script
4. Run **STEP 1** first to preview what will be deleted
5. Review the results carefully
6. Uncomment and run **STEP 2** to delete the data
7. Run **STEP 3** to verify cleanup

### Step 2: Delete User Accounts (2 minutes)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search and delete these accounts:
   - sreshtha.form131@gmail.com
   - sreshtha.mechlin@gmail.com
   - priya@example.com
   - ajay@example.com
   - sneha@example.com

### Step 3: Verify in Admin Dashboard (2 minutes)

1. Open your admin dashboard
2. Check `/admin/orders` - should show 0 or only real orders
3. Check `/admin/customers` - should show 0 or only real customers
4. Check `/admin/analytics` - should show updated/zero data

---

## 📋 Full Documentation

For detailed instructions, see: `Documents/CLEANUP_ORDERS_CUSTOMERS_ANALYTICS.md`

That guide includes:
- ✅ Step-by-step instructions with screenshots context
- ✅ Two cleanup methods (targeted or complete reset)
- ✅ Verification queries
- ✅ Troubleshooting guide
- ✅ Impact on analytics explanation

---

## 🆘 If Something Goes Wrong

1. **Backup first**: Always backup before running SQL scripts
2. **Review queries**: Run STEP 1 (preview) before STEP 2 (delete)
3. **Check email list**: Make sure you're only deleting test accounts
4. **Read full guide**: See `CLEANUP_ORDERS_CUSTOMERS_ANALYTICS.md`

---

## ✅ After Cleanup

Your admin dashboard will show:
- ✓ No test orders
- ✓ No test customer accounts
- ✓ Analytics reset to zero or showing only real data
- ✓ Ready for real customer orders

This is the expected and correct state for a production system!

---

**Quick Links:**
- Full Guide: `Documents/CLEANUP_ORDERS_CUSTOMERS_ANALYTICS.md`
- SQL Script: `migrations/quick-cleanup-orders-customers.sql`
- Main Cleanup: `Documents/CLEANUP_INDEX.md`
