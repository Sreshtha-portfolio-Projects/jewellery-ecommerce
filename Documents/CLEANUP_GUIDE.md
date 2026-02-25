# Portal Cleanup Guide - Removing Dummy Data

## Overview
This guide outlines all dummy/placeholder content in the Aldorado Jewells portal and provides step-by-step instructions to replace it with production-ready content.

---

## 1. Frontend Components Cleanup

### 1.1 Testimonials Component
**File:** `frontend/src/components/Testimonials.jsx`

**Current Issue:** Hardcoded fake testimonials (Sarah M., Jessica T., Emily R., Maria L., Sophie K.)

**Solution Options:**

#### Option A: Connect to Reviews Database
```javascript
// Fetch real customer reviews from the database
useEffect(() => {
  const fetchReviews = async () => {
    try {
      const response = await reviewService.getFeaturedReviews();
      setTestimonials(response);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };
  fetchReviews();
}, []);
```

#### Option B: Remove Component Temporarily
If you don't have real testimonials yet:
1. Comment out `<Testimonials />` in `frontend/src/pages/Home.jsx` (line 57)
2. Re-enable when you have real customer reviews

#### Option C: Replace with Real Data
Replace the dummy testimonials array with actual customer feedback you've received.

---

### 1.2 Hero & Banner Images
**Files:** 
- `frontend/src/components/Hero.jsx`
- `frontend/src/components/PromotionalBanner.jsx`
- `frontend/src/components/GetInspired.jsx`
- `frontend/src/pages/Home.jsx`

**Current Issue:** Using generic Unsplash stock images

**Action Required:**

1. **Gather Real Product Photos**
   - Professional product photography of your actual jewelry
   - High-resolution images (minimum 1920x1080 for hero, 800x800 for products)
   - Images showcasing your brand's unique style

2. **Upload to Supabase Storage**
   ```bash
   # Create storage buckets in Supabase Dashboard
   - Navigate to Storage
   - Create bucket: 'hero-images'
   - Create bucket: 'promotional-images'
   - Create bucket: 'inspiration-gallery'
   ```

3. **Update Image URLs**
   Replace Unsplash URLs with your Supabase Storage URLs:
   
   **Hero.jsx (line 9):**
   ```javascript
   // Replace:
   bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200')]
   
   // With:
   bg-[url('YOUR_SUPABASE_STORAGE_URL/hero-images/main-hero.jpg')]
   ```

   **Home.jsx (lines 20-31):**
   - Replace promotional banner images
   - Replace "Elevate Your Look" section background image

   **GetInspired.jsx (lines 2-7):**
   - Replace with 4 unique, real product showcase images

---

### 1.3 Shop By Category Images
**File:** `frontend/src/components/ShopByCategory.jsx`

**Action Required:**
- Replace the single stock image (line 43) with representative images for each category
- Consider creating a category image mapping for dynamic display

---

## 2. Database Cleanup

### 2.1 Remove Sample Products
**File:** `migrations/supabase-setup.sql` (lines 36-48)

**Action Steps:**

1. **In Supabase SQL Editor, run:**
   ```sql
   -- View all products to identify sample data
   SELECT id, name, image_url, description FROM products;
   
   -- Delete sample products (CAREFUL: This will delete ALL products)
   -- Only run this if you haven't added real products yet
   DELETE FROM products 
   WHERE image_url LIKE '%unsplash.com%';
   
   -- Or delete specific sample products by name
   DELETE FROM products 
   WHERE name IN (
     'Solitaire Diamond Ring',
     'Gold Hoop Earrings',
     'Gold Triangle Stud Earrings',
     'Rose Gold Diamond Ring',
     'Rose Gold Pendant Necklace',
     'Princess Diamond Ring',
     'Butterfly Stud Earrings',
     'Swirl Diamond Ring',
     'Gold Bar Drop Earrings',
     'Gold Oval Hoop Earrings',
     'Pearl Bracelet',
     'Diamond Tennis Bracelet'
   );
   ```

2. **Verify deletion:**
   ```sql
   SELECT COUNT(*) FROM products;
   ```

3. **Add Your Real Products:**
   - Use the Admin Dashboard at `/admin/products`
   - Click "Add New Product"
   - Upload real product images via Supabase Storage
   - Fill in accurate product details, pricing, variants

---

### 2.2 Update Metal Rates
**File:** `migrations/add-metal-rates-table.sql` (lines 35-39)

**Current Issue:** Placeholder rates with 'manual_seed' source

**Action Steps:**

1. **Update Metal Rates via Admin Dashboard:**
   - Navigate to `/admin/metal-rates`
   - Click "Update Metal Rates" button
   - This will fetch live rates from MetalPriceAPI

2. **Or manually update in database:**
   ```sql
   -- Check current rates
   SELECT * FROM metal_rates;
   
   -- Update with current market rates
   UPDATE metal_rates 
   SET 
     price_per_gram = YOUR_CURRENT_GOLD_RATE,
     price_per_oz = YOUR_CURRENT_GOLD_RATE_PER_OZ,
     source = 'metalpriceapi',
     last_updated = NOW()
   WHERE metal_type = 'gold';
   
   UPDATE metal_rates 
   SET 
     price_per_gram = YOUR_CURRENT_SILVER_RATE,
     price_per_oz = YOUR_CURRENT_SILVER_RATE_PER_OZ,
     source = 'metalpriceapi',
     last_updated = NOW()
   WHERE metal_type = 'silver';
   ```

---

## 3. Configuration & Settings Cleanup

### 3.1 Environment Variables
**File:** `backend/.env`

**Review Required:**
- Ensure all API keys are production keys (not test keys)
- Update `ALLOWED_ADMIN_EMAILS` with actual admin emails
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are production keys if going live

**File:** `frontend/.env`

**Review Required:**
- Ensure `VITE_API_BASE_URL` points to production API when deployed

---

### 3.2 Admin Settings
**Action:** Review and update via Admin Dashboard

1. **Navigate to `/admin/settings`**
2. **Update:**
   - Tax rates (GST/VAT)
   - Shipping charges
   - Inventory lock duration
   - Payment settings
   - Return/refund policies

---

## 4. Content That's Fine (Not Dummy)

These items are functional and don't need cleanup:
- ✅ Shop by Shape icons (generic diamond shapes)
- ✅ Category names (Rings, Earrings, Bracelets, Pendants, Necklaces)
- ✅ Footer content (can be customized but not dummy data)
- ✅ Authentication system
- ✅ Cart, Checkout, Payment flows
- ✅ Order management system

---

## 5. Recommended Cleanup Order

### Phase 1: Critical (Do First)
1. ✅ Remove sample products from database
2. ✅ Add real products via Admin Dashboard
3. ✅ Update metal rates to current prices

### Phase 2: Visual (Do Before Launch)
4. ✅ Replace hero images with real photography
5. ✅ Replace promotional banner images
6. ✅ Update "Get Inspired" gallery with real products

### Phase 3: Polish (Can Do Later)
7. ✅ Add real customer testimonials or remove component
8. ✅ Add category-specific images for "Shop by Category"
9. ✅ Review and update all admin settings

---

## 6. Verification Checklist

After cleanup, verify:

- [ ] No Unsplash URLs in production
- [ ] All product images are real jewelry photos
- [ ] Product data reflects actual inventory
- [ ] Metal rates are current and updating properly
- [ ] No generic "Sarah M." style testimonials
- [ ] Admin emails are correct
- [ ] Payment gateway uses production credentials
- [ ] All hero/banner images show actual products

---

## 7. Quick Commands

### Check for Unsplash URLs in codebase:
```bash
# In Git Bash or WSL
cd frontend/src
grep -r "unsplash.com" .

# Count occurrences
grep -r "unsplash.com" . | wc -l
```

### Verify Database Products:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as products_with_stock FROM products WHERE stock_quantity > 0;
SELECT COUNT(*) as bestsellers FROM products WHERE is_bestseller = true;
```

---

## 8. Need Help?

If you need assistance with:
- Professional product photography
- Bulk product import
- Database cleanup scripts
- Custom migration for real data

Contact: support@aldoradojewells.com

---

**Last Updated:** February 24, 2026
**Version:** 1.0
