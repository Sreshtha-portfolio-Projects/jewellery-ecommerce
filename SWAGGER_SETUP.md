# Swagger API Documentation Setup

## ✅ Implementation Complete

Swagger/OpenAPI documentation has been set up for the Aldorado Jewells API.

## 📍 Access Swagger UI

Once the server is running, access the Swagger documentation at:

**http://localhost:3000/api-docs**

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Access Swagger UI

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

## 📚 Documented Endpoints

### General
- ✅ Root Endpoint (`GET /`)
- ✅ Health Check (`GET /health`)

### Authentication
- ✅ Admin Login (`POST /api/auth/admin/login`)
- ✅ Customer Signup (`POST /api/auth/signup`)
- ✅ Customer Login (`POST /api/auth/login`)
- ✅ Get Profile (`GET /api/auth/me`)

### Products (Public)
- ✅ Get All Products (`GET /api/products`)
- ✅ Get Product by ID (`GET /api/products/:id`)

### Admin Products
- ✅ List Products (`GET /api/admin/products`)
- ✅ Get Product (`GET /api/admin/products/:id`)
- ✅ Create Product (`POST /api/admin/products`)
- ✅ Update Product (`PUT /api/admin/products/:id`)
- ✅ Delete Product (`DELETE /api/admin/products/:id`)
- ✅ Create Variant (`POST /api/admin/products/:productId/variants`)
- ✅ Update Variant (`PUT /api/admin/products/variants/:variantId`)
- ✅ Delete Variant (`DELETE /api/admin/products/variants/:variantId`)
- ✅ Upload Image (`POST /api/admin/products/:productId/images/upload`)
- ✅ Add Image URL (`POST /api/admin/products/:productId/images`)
- ✅ Bulk Import (`POST /api/admin/products/bulk-import`)
- ✅ Bulk Export (`GET /api/admin/products/bulk-export`)

### Cart
- ✅ Get Cart (`GET /api/cart`)
- ✅ Add to Cart (`POST /api/cart`)
- ✅ Update Cart Item (`PUT /api/cart/:id`)
- ✅ Remove from Cart (`DELETE /api/cart/:id`)
- ✅ Clear Cart (`DELETE /api/cart`)

### Orders
- ✅ Create Order (`POST /api/orders`)
- ✅ Get Orders (`GET /api/orders`)
- ✅ Get Order by ID (`GET /api/orders/:id`)
- ✅ Update Order Status (`PUT /api/orders/:id/status`)

### Addresses
- ✅ Get Addresses (`GET /api/addresses`)
- ✅ Create Address (`POST /api/addresses`)
- ✅ Update Address (`PUT /api/addresses/:id`)
- ✅ Delete Address (`DELETE /api/addresses/:id`)

### Wishlist
- ✅ Get Wishlist (`GET /api/wishlist`)
- ✅ Add to Wishlist (`POST /api/wishlist`)
- ✅ Remove from Wishlist (`DELETE /api/wishlist/:productId`)
- ✅ Check if in Wishlist (`GET /api/wishlist/check/:productId`)

### Discounts
- ✅ Validate Discount Code (`POST /api/discounts/validate`) - Public
- ✅ Get Discounts (`GET /api/discounts`) - Admin
- ✅ Create Discount (`POST /api/discounts`) - Admin
- ✅ Update Discount (`PUT /api/discounts/:id`) - Admin
- ✅ Delete Discount (`DELETE /api/discounts/:id`) - Admin

### Reviews
- ✅ Get Product Reviews (`GET /api/reviews/product/:productId`)
- ✅ Create Review (`POST /api/reviews/product/:productId`)
- ✅ Delete Review (`DELETE /api/reviews/:reviewId`)

### Delivery
- ✅ Check Delivery (`GET /api/delivery/check`)

### Shipments
- ✅ Create Shipment (`POST /api/shipments/:orderId/create`)
- ✅ Get Tracking (`GET /api/shipments/:orderId/tracking`)
- ✅ Get Shipment (`GET /api/shipments/:orderId`)

### Product Pairings
- ✅ Get Paired Products (`GET /api/product-pairings/product/:productId`)
- ✅ Create Pairing (`POST /api/product-pairings`) - Admin
- ✅ Delete Pairing (`DELETE /api/product-pairings/:pairingId`) - Admin

### Admin Dashboard
- ✅ Health Check (`GET /api/admin/health`)
- ✅ Dashboard KPIs (`GET /api/admin/dashboard/kpis`)
- ✅ Revenue by Metal (`GET /api/admin/analytics/revenue-by-metal`)
- ✅ Sales Comparison (`GET /api/admin/analytics/sales-comparison`)
- ✅ Low Stock Products (`GET /api/admin/products/low-stock`)
- ✅ Get All Orders (`GET /api/admin/orders`)
- ✅ Get Order Details (`GET /api/admin/orders/:id`)

### Pricing Rules
- ✅ Get Pricing Rules (`GET /api/admin/pricing-rules`)
- ✅ Create Pricing Rule (`POST /api/admin/pricing-rules`)
- ✅ Update Pricing Rule (`PUT /api/admin/pricing-rules/:id`)
- ✅ Delete Pricing Rule (`DELETE /api/admin/pricing-rules/:id`)

## 🔐 Authentication in Swagger

To test protected endpoints:

1. Click the **Authorize** button (🔒) at the top of the Swagger UI
2. Enter your JWT token (obtained from login endpoints)
3. Click **Authorize**
4. Now you can test all protected endpoints

### Getting a Token

1. Use the `/api/auth/admin/login` endpoint to get an admin token
2. Or use `/api/auth/login` to get a customer token
3. Copy the `token` from the response
4. Use it in the Authorize dialog

## 🎯 Features

- **Interactive Testing**: Test all endpoints directly from the browser
- **Request/Response Examples**: See example payloads for all endpoints
- **Schema Definitions**: View data models and structures
- **Authentication Support**: JWT bearer token authentication
- **Organized by Tags**: Endpoints grouped by functionality

## 📝 Adding More Documentation

To add Swagger docs to new routes, use JSDoc comments:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', yourController);
```

## 🚀 Next Steps

1. Install dependencies: `npm install swagger-jsdoc swagger-ui-express`
2. Restart server
3. Visit `http://localhost:3000/api-docs`
4. Start testing your API!

The Swagger UI provides a complete interactive API testing environment. 🎉

