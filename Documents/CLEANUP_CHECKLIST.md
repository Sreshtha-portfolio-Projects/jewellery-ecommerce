# Dummy Data Cleanup - Action Checklist

Track your progress in cleaning up dummy/placeholder content from the Aldorado Jewells portal.

---

## 🎯 Quick Summary

**Total Items to Clean:** 15
- **Critical (Must Do):** 5 items
- **Important (Before Launch):** 6 items  
- **Polish (Can Wait):** 4 items

---

## 📋 Phase 1: Database Cleanup (CRITICAL)

### Database Products
- [ ] **Backup current products table**
  - Action: Run `SELECT * FROM products;` in Supabase SQL Editor
  - Save results to CSV
  - Location: Store backup in a safe location

- [ ] **Delete sample products**
  - Action: Run `migrations/cleanup-dummy-data.sql` script in Supabase SQL Editor
  - Verify: Run `SELECT COUNT(*) FROM products;` 
  - Expected: 0 or only real products remain

- [ ] **Verify related tables cleaned**
  - [ ] product_images table
  - [ ] product_variants table
  - [ ] carts table (orphaned items)
  - [ ] wishlists table (orphaned items)

### Database Orders & Customers
- [ ] **Review test orders and customer accounts**
  - Check `/admin/orders` for test orders
  - Check `/admin/customers` for test customer accounts
  - Document test email addresses to remove

- [ ] **Clean test orders and customers**
  - **Guide**: See `Documents/CLEANUP_ORDERS_CUSTOMERS_ANALYTICS.md` for detailed instructions
  - Method 1 (Targeted): Remove only test data
  - Method 2 (Complete Reset): Remove ALL orders and customers
  - Verify: Check admin dashboard shows correct data

- [ ] **Verify analytics data**
  - [ ] Check `/admin/analytics` - revenue should reflect real orders only
  - [ ] Sales trends should show accurate data
  - [ ] Customer count should be correct

### Database Metal Rates
- [ ] **Update gold and silver rates**
  - Method 1: Admin Dashboard `/admin/metal-rates` → Click "Update Metal Rates"
  - Method 2: Manually update in Supabase SQL Editor
  - Verify: Check that `source` column shows 'metalpriceapi' not 'manual_seed'

---

## 📋 Phase 2: Add Real Products (CRITICAL)

- [ ] **Prepare product data**
  - [ ] Gather product names, descriptions, prices
  - [ ] Prepare high-quality product images
  - [ ] Upload images to Supabase Storage bucket 'product-images'
  - [ ] Document product variants (size, color, metal type)

- [ ] **Add products via Admin Dashboard**
  - [ ] Navigate to `/admin/products`
  - [ ] Click "Add New Product" for each product
  - [ ] Fill in all required fields
  - [ ] Upload product images
  - [ ] Add variants if applicable
  - [ ] Mark bestsellers appropriately

- [ ] **Verify products display correctly**
  - [ ] Check homepage "Bestseller Products" section
  - [ ] Check `/products` page
  - [ ] Check individual product detail pages
  - [ ] Test filtering by category

---

## 📋 Phase 3: Frontend Images (IMPORTANT)

### Hero & Main Banners
- [ ] **Hero Section** (`frontend/src/components/Hero.jsx`)
  - Current: Line 9 has Unsplash URL
  - [ ] Take/source professional hero image
  - [ ] Upload to Supabase Storage 'hero-images' bucket
  - [ ] Update URL in Hero.jsx line 9
  - [ ] Test on mobile and desktop

- [ ] **Home Page Promotional Banners** (`frontend/src/pages/Home.jsx`)
  - [ ] Banner 1 (Line 20): Replace Unsplash URL
  - [ ] Banner 2 (Line 26): Replace Unsplash URL
  - [ ] "Elevate Your Look" section (Line 39): Replace background image
  - [ ] Upload all images to Supabase Storage 'promotional-images'
  - [ ] Update URLs in Home.jsx

### Category & Inspiration Images
- [ ] **Shop By Category** (`frontend/src/components/ShopByCategory.jsx`)
  - Current: Line 43 has single Unsplash URL
  - [ ] Create category-specific images for Rings, Earrings, Bracelets, Pendants, Necklaces
  - [ ] Upload to Supabase Storage
  - [ ] Update component to use dynamic category images

- [ ] **Get Inspired Gallery** (`frontend/src/components/GetInspired.jsx`)
  - Current: Lines 3-6 have Unsplash URLs (4 images)
  - [ ] Prepare 4 unique lifestyle/product showcase images
  - [ ] Upload to Supabase Storage 'inspiration-gallery'
  - [ ] Update image URLs in component

---

## 📋 Phase 4: Testimonials (POLISH)

- [ ] **Decide on approach:**
  - **Option A:** Connect to reviews database
    - [ ] Implement API call to fetch featured reviews
    - [ ] Update Testimonials.jsx to use real data
    - [ ] Add admin interface to mark reviews as "featured"
  
  - **Option B:** Remove temporarily
    - [ ] Comment out `<Testimonials />` in Home.jsx line 57
    - [ ] Re-enable when real testimonials available
  
  - **Option C:** Use real feedback
    - [ ] Collect real customer testimonials
    - [ ] Replace dummy testimonials array with real data
    - [ ] Get customer permission to use their feedback

---

## 📋 Phase 5: Configuration Review (IMPORTANT)

### Environment Variables
- [ ] **Backend `.env` file** (`backend/.env`)
  - [ ] Review `ALLOWED_ADMIN_EMAILS` - ensure only real admins
  - [ ] Check `RAZORPAY_KEY_ID` - use production key if live
  - [ ] Check `RAZORPAY_KEY_SECRET` - use production key if live
  - [ ] Verify `JWT_SECRET` is strong and unique
  - [ ] Confirm `SUPABASE_URL` is correct
  - [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is correct

- [ ] **Frontend `.env` file** (`frontend/.env`)
  - [ ] Verify `VITE_API_BASE_URL` points to correct API
  - [ ] Update to production API URL when deploying

### Admin Settings
- [ ] **Review Admin Dashboard Settings** (`/admin/settings`)
  - [ ] Tax rate (GST/VAT) is correct for your region
  - [ ] Shipping charges are accurate
  - [ ] Inventory lock duration is appropriate
  - [ ] Return policy settings are configured
  - [ ] Refund settings are configured

---

## 📋 Phase 6: Content Verification (POLISH)

### Code Cleanup
- [ ] **Search for remaining Unsplash URLs**
  ```bash
  cd frontend/src
  grep -r "unsplash.com" .
  ```
  - [ ] Verify all instances are replaced

- [ ] **Search for "TODO" and "FIXME" comments**
  ```bash
  grep -r "TODO\|FIXME" frontend/src backend/src
  ```
  - [ ] Address any critical TODOs

### Database Verification
- [ ] **Run verification queries** (in Supabase SQL Editor)
  ```sql
  -- No Unsplash URLs in products
  SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash.com%';
  -- Expected: 0
  
  -- All products have stock
  SELECT COUNT(*) FROM products WHERE stock_quantity > 0;
  
  -- Metal rates are updated
  SELECT metal_type, price_per_gram, source, last_updated FROM metal_rates;
  -- Expected: source != 'manual_seed'
  ```

---

## 📋 Phase 7: Testing (CRITICAL)

### Frontend Testing
- [ ] **Homepage**
  - [ ] All images load correctly
  - [ ] No broken image links
  - [ ] Hero section displays properly
  - [ ] Bestseller products show real products
  - [ ] Testimonials section is acceptable

- [ ] **Products Page**
  - [ ] Real products display
  - [ ] Filtering works
  - [ ] Product images load
  - [ ] Prices display correctly

- [ ] **Product Detail Page**
  - [ ] Product information is accurate
  - [ ] Images are high quality
  - [ ] Variants work correctly
  - [ ] Add to cart functions properly

### Admin Testing
- [ ] **Admin Dashboard**
  - [ ] Product list shows real products
  - [ ] Metal rates are current
  - [ ] Settings are configured
  - [ ] Analytics show real data (or empty if no orders)

---

## 📋 Phase 8: Pre-Launch Checklist (IMPORTANT)

- [ ] **Security Review**
  - [ ] No test admin emails in production
  - [ ] All API keys are production keys
  - [ ] Environment variables are secure
  - [ ] .env files are in .gitignore

- [ ] **Performance Check**
  - [ ] All images are optimized (not too large)
  - [ ] Page load times are acceptable
  - [ ] Mobile performance is good

- [ ] **Content Review**
  - [ ] No lorem ipsum text
  - [ ] No "Test" or "Sample" product names
  - [ ] All descriptions are accurate and professional
  - [ ] Pricing is correct

- [ ] **Legal/Compliance**
  - [ ] Privacy policy is updated
  - [ ] Terms of service are updated
  - [ ] Return/refund policy is clear
  - [ ] Contact information is correct

---

## ✅ Completion Checklist

Mark each phase as complete:

- [ ] **Phase 1:** Database Cleanup - DONE
- [ ] **Phase 2:** Add Real Products - DONE  
- [ ] **Phase 3:** Frontend Images - DONE
- [ ] **Phase 4:** Testimonials - DONE
- [ ] **Phase 5:** Configuration Review - DONE
- [ ] **Phase 6:** Content Verification - DONE
- [ ] **Phase 7:** Testing - DONE
- [ ] **Phase 8:** Pre-Launch - DONE

---

## 🎉 Final Sign-Off

Once all phases are complete:

- [ ] Review with team/stakeholders
- [ ] Get approval from business owner
- [ ] Schedule deployment
- [ ] Monitor after launch
- [ ] Gather real customer feedback

---

## 📞 Need Help?

If you encounter issues during cleanup:
1. Check the detailed `CLEANUP_GUIDE.md` 
2. Review the database cleanup script `migrations/cleanup-dummy-data.sql`
3. Contact development team

---

**Started:** _____________
**Target Completion:** _____________
**Actual Completion:** _____________

**Notes:**
