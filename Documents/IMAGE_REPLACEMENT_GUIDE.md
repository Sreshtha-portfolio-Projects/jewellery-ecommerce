# Image Replacement Guide

Complete guide for replacing all placeholder images with real product photography.

---

## 📸 Overview

**Total Images to Replace:** ~15 locations
- Hero/Banner images: 5
- Product images: 12+ (in database)
- Gallery images: 4
- Category images: 1-5

---

## 🎯 Image Requirements

### Technical Specifications

| Image Type | Dimensions | Format | Max Size | Notes |
|------------|-----------|--------|----------|-------|
| **Hero Image** | 1920x1080 (min) | JPG/WebP | 500KB | High quality, landscape |
| **Promotional Banners** | 1200x800 | JPG/WebP | 300KB | Landscape orientation |
| **Product Images** | 1000x1000 | JPG/PNG | 200KB | Square, white background |
| **Gallery Images** | 800x800 | JPG/WebP | 150KB | Square, lifestyle shots |
| **Category Images** | 800x800 | JPG/WebP | 150KB | Square, representative |

### Quality Guidelines
- ✅ High resolution but optimized for web
- ✅ Good lighting and professional appearance
- ✅ Consistent style across all images
- ✅ No watermarks or branding (unless your own)
- ✅ Proper white balance and color correction

---

## 📤 Step 1: Prepare Your Images

### 1.1 Organize Your Photos
Create local folders:
```
/jewelry-photos
  /hero
    - main-hero.jpg
  /banners
    - promo-1.jpg
    - promo-2.jpg
    - elevate-section.jpg
  /products
    - product-001-main.jpg
    - product-001-alt-1.jpg
    - product-001-alt-2.jpg
    - product-002-main.jpg
    ...
  /gallery
    - inspiration-1.jpg
    - inspiration-2.jpg
    - inspiration-3.jpg
    - inspiration-4.jpg
  /categories
    - rings-category.jpg
    - earrings-category.jpg
    - necklaces-category.jpg
    - bracelets-category.jpg
    - pendants-category.jpg
```

### 1.2 Optimize Images
Use tools like:
- **TinyPNG** (https://tinypng.com/) - Online compression
- **ImageOptim** (Mac) - Desktop app
- **Squoosh** (https://squoosh.app/) - Google's web app

Target compression:
- Hero images: < 500KB
- Product images: < 200KB
- Gallery images: < 150KB

---

## ☁️ Step 2: Upload to Supabase Storage

### 2.1 Create Storage Buckets

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click "Storage" in left sidebar

2. **Create Buckets:**
   
   **Bucket 1: hero-images**
   - Click "New bucket"
   - Name: `hero-images`
   - Public: ✅ Yes (public bucket)
   - Click "Create bucket"

   **Bucket 2: promotional-images**
   - Name: `promotional-images`
   - Public: ✅ Yes

   **Bucket 3: product-images**
   - Name: `product-images`
   - Public: ✅ Yes

   **Bucket 4: inspiration-gallery**
   - Name: `inspiration-gallery`
   - Public: ✅ Yes

   **Bucket 5: category-images**
   - Name: `category-images`
   - Public: ✅ Yes

### 2.2 Upload Images

For each bucket:
1. Click on bucket name
2. Click "Upload file"
3. Select your optimized images
4. Wait for upload to complete

### 2.3 Get Image URLs

For each uploaded image:
1. Click on the image in Supabase Storage
2. Click "Get URL" or "Copy URL"
3. Copy the public URL
4. Save it in a reference document

**URL Format:**
```
https://[your-project].supabase.co/storage/v1/object/public/[bucket-name]/[file-name]
```

**Example:**
```
https://abcdefgh.supabase.co/storage/v1/object/public/hero-images/main-hero.jpg
```

---

## 🔄 Step 3: Replace URLs in Code

### 3.1 Hero Section

**File:** `frontend/src/components/Hero.jsx`

**Line 9 - Find:**
```javascript
<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200')] bg-cover bg-center"></div>
```

**Replace with:**
```javascript
<div className="absolute inset-0 bg-[url('https://[your-project].supabase.co/storage/v1/object/public/hero-images/main-hero.jpg')] bg-cover bg-center"></div>
```

### 3.2 Home Page Promotional Banners

**File:** `frontend/src/pages/Home.jsx`

**Line 20 - Find:**
```javascript
image="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"
```

**Replace with:**
```javascript
image="https://[your-project].supabase.co/storage/v1/object/public/promotional-images/promo-1.jpg"
```

**Line 26 - Find:**
```javascript
image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"
```

**Replace with:**
```javascript
image="https://[your-project].supabase.co/storage/v1/object/public/promotional-images/promo-2.jpg"
```

**Line 39 - Find:**
```javascript
<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1200')] bg-cover bg-center"></div>
```

**Replace with:**
```javascript
<div className="absolute inset-0 bg-[url('https://[your-project].supabase.co/storage/v1/object/public/promotional-images/elevate-section.jpg')] bg-cover bg-center"></div>
```

### 3.3 Get Inspired Gallery

**File:** `frontend/src/components/GetInspired.jsx`

**Lines 3-6 - Find:**
```javascript
const images = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600',
];
```

**Replace with:**
```javascript
const images = [
  'https://[your-project].supabase.co/storage/v1/object/public/inspiration-gallery/inspiration-1.jpg',
  'https://[your-project].supabase.co/storage/v1/object/public/inspiration-gallery/inspiration-2.jpg',
  'https://[your-project].supabase.co/storage/v1/object/public/inspiration-gallery/inspiration-3.jpg',
  'https://[your-project].supabase.co/storage/v1/object/public/inspiration-gallery/inspiration-4.jpg',
];
```

### 3.4 Shop By Category (Basic Fix)

**File:** `frontend/src/components/ShopByCategory.jsx`

**Line 43 - Find:**
```javascript
src="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"
```

**Replace with:**
```javascript
src="https://[your-project].supabase.co/storage/v1/object/public/category-images/rings-category.jpg"
```

### 3.5 Shop By Category (Advanced - Dynamic Images)

For dynamic category images, modify the component:

**File:** `frontend/src/components/ShopByCategory.jsx`

**Replace entire component with:**
```javascript
import { Link } from 'react-router-dom';
import { useState } from 'react';

const ShopByCategory = () => {
  const categories = [
    { 
      name: 'Rings', 
      path: '/products/rings', 
      active: true,
      image: 'https://[your-project].supabase.co/storage/v1/object/public/category-images/rings-category.jpg'
    },
    { 
      name: 'Earrings', 
      path: '/products/earrings',
      image: 'https://[your-project].supabase.co/storage/v1/object/public/category-images/earrings-category.jpg'
    },
    { 
      name: 'Bracelets', 
      path: '/products/bracelets',
      image: 'https://[your-project].supabase.co/storage/v1/object/public/category-images/bracelets-category.jpg'
    },
    { 
      name: 'Pendants', 
      path: '/products/pendants',
      image: 'https://[your-project].supabase.co/storage/v1/object/public/category-images/pendants-category.jpg'
    },
    { 
      name: 'Necklaces', 
      path: '/products/necklaces',
      image: 'https://[your-project].supabase.co/storage/v1/object/public/category-images/necklaces-category.jpg'
    },
  ];

  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Shop By Category</h2>
            <div className="space-y-3 sm:space-y-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  onMouseEnter={() => setActiveCategory(category)}
                  className={`flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base ${
                    activeCategory.name === category.name
                      ? 'bg-rose-50 text-rose-700 border-l-4 border-rose-600'
                      : 'text-gray-700 hover:bg-beige-50'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="aspect-square rounded-lg overflow-hidden bg-beige-100">
              <img
                src={activeCategory.image}
                alt={`${activeCategory.name} category`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
```

---

## 🗄️ Step 4: Product Images (Database)

### Option A: Via Admin Dashboard (Recommended)

1. **Navigate to Admin Dashboard**
   - Go to `/admin/products`
   - Click "Add New Product"

2. **For Each Product:**
   - Fill in product details
   - Click "Upload Image" or similar
   - Select product image from your computer
   - The system will upload to Supabase Storage automatically
   - Add multiple images if supported

### Option B: Bulk Update (Advanced)

If you need to update many products at once:

1. **Upload all product images to Supabase Storage**
   - Bucket: `product-images`
   - Naming convention: `product-{SKU}-main.jpg`, `product-{SKU}-alt-1.jpg`

2. **Update database with SQL:**
```sql
-- Update individual product
UPDATE products 
SET image_url = 'https://[your-project].supabase.co/storage/v1/object/public/product-images/product-001-main.jpg'
WHERE id = '[product-uuid]';

-- Or update by name
UPDATE products 
SET image_url = 'https://[your-project].supabase.co/storage/v1/object/public/product-images/diamond-ring.jpg'
WHERE name = 'Diamond Ring';
```

3. **For multiple images per product:**
```sql
-- Add to product_images table
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
VALUES 
  ('[product-uuid]', 'https://[...]/product-001-main.jpg', true, 1),
  ('[product-uuid]', 'https://[...]/product-001-alt-1.jpg', false, 2),
  ('[product-uuid]', 'https://[...]/product-001-alt-2.jpg', false, 3);
```

---

## ✅ Step 5: Verify Changes

### 5.1 Visual Verification
Visit these pages and check images:
- [ ] Homepage (`/`)
  - [ ] Hero section
  - [ ] Bestseller products
  - [ ] Promotional banners
  - [ ] Get Inspired gallery
- [ ] Products page (`/products`)
  - [ ] Product thumbnails
- [ ] Product detail page (`/products/:id`)
  - [ ] Main product image
  - [ ] Additional images
- [ ] Categories (`/products/rings`, etc.)
  - [ ] Category images

### 5.2 Technical Verification

**Check browser console:**
- Open DevTools (F12)
- Go to Console tab
- Look for 404 errors or image load failures

**Check image loading:**
```javascript
// Run in browser console
document.querySelectorAll('img').forEach(img => {
  if (!img.complete || img.naturalWidth === 0) {
    console.error('Failed to load:', img.src);
  }
});
```

**Verify no Unsplash URLs remain:**
```bash
# In terminal
cd frontend/src
grep -r "unsplash.com" .
```

### 5.3 Performance Check

Use tools to verify image optimization:
- **Lighthouse** (Chrome DevTools)
- **PageSpeed Insights** (https://pagespeed.web.dev/)
- **GTmetrix** (https://gtmetrix.com/)

Target scores:
- Image optimization: > 90%
- Page load time: < 3 seconds
- Largest Contentful Paint (LCP): < 2.5s

---

## 🚀 Step 6: Deploy Changes

### Development
```bash
# Test locally first
cd frontend
npm run dev
# Visit http://localhost:5173 and verify all images
```

### Production
```bash
# Build production bundle
cd frontend
npm run build

# Deploy to Vercel (if using Vercel)
vercel --prod

# Or push to GitHub and let auto-deployment handle it
git add .
git commit -m "Replace placeholder images with real product photos"
git push origin main
```

---

## 📋 Image Replacement Checklist

Use this to track your progress:

### Hero & Banners
- [ ] Hero background image uploaded to Supabase
- [ ] Hero.jsx updated with new URL
- [ ] Promotional banner 1 uploaded
- [ ] Home.jsx line 20 updated
- [ ] Promotional banner 2 uploaded
- [ ] Home.jsx line 26 updated
- [ ] Elevate section background uploaded
- [ ] Home.jsx line 39 updated

### Gallery & Categories
- [ ] 4 inspiration images uploaded
- [ ] GetInspired.jsx updated
- [ ] Category images uploaded (5 categories)
- [ ] ShopByCategory.jsx updated

### Products
- [ ] All product images uploaded to Supabase
- [ ] Products added/updated via Admin Dashboard
- [ ] Product images display correctly on product pages
- [ ] Thumbnail images show on listings

### Verification
- [ ] No 404 image errors in console
- [ ] No Unsplash URLs in code
- [ ] All images load quickly
- [ ] Images look good on mobile
- [ ] Images look good on desktop

---

## 🔧 Troubleshooting

### Images Not Loading

**Problem:** Images show broken icon
**Solutions:**
1. Check bucket is public in Supabase Storage
2. Verify URL is correct (copy from Supabase Dashboard)
3. Check CORS settings in Supabase
4. Clear browser cache (Ctrl+Shift+R)

### Images Too Large / Slow Loading

**Problem:** Images take too long to load
**Solutions:**
1. Compress images more (use TinyPNG)
2. Use WebP format instead of JPG
3. Implement lazy loading:
```javascript
<img src="..." loading="lazy" alt="..." />
```

### Wrong Image Aspect Ratio

**Problem:** Images look stretched or cropped badly
**Solutions:**
1. Ensure images match required dimensions
2. Use `object-cover` or `object-contain` CSS class
3. Crop images to correct aspect ratio before uploading

---

## 💡 Pro Tips

1. **Use WebP format** - Better compression than JPG
2. **Implement lazy loading** - Images load as user scrolls
3. **Use responsive images** - Serve different sizes for mobile/desktop
4. **Add alt text** - Improve SEO and accessibility
5. **Version your images** - Add `?v=1` to URLs to bust cache when updating
6. **Keep backups** - Save original high-res versions locally

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase Storage bucket permissions
2. Verify URLs are publicly accessible
3. Test images in incognito browser
4. Check browser console for errors

---

**Last Updated:** February 24, 2026
