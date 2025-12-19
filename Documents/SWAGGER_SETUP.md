# Swagger API Documentation Setup

## Implementation Complete

Swagger/OpenAPI documentation has been set up for the Aldorado Jewells API. The documentation is automatically generated from JSDoc comments in the route files.

## Access Swagger UI

Once the server is running, access the Swagger documentation at:

**Local Development**: `http://localhost:3000/api-docs`

**Production**: `https://your-backend-url.onrender.com/api-docs`

## Setup Instructions

### Step 1: Install Dependencies

The Swagger dependencies should already be installed. If not, run:

```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Start Server

```bash
npm run dev
```

### Step 3: Access Swagger UI

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

## Documented Endpoints

The API documentation includes the following endpoint categories:

### Health & System

- `GET /health` - Comprehensive health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /api/health` - Simple health check
- `GET /` - API root with endpoint listing
- `GET /api/debug/routes` - List all registered routes

### Authentication

**Customer Authentication:**
- `POST /api/auth/signup` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

**Admin Authentication:**
- `POST /api/auth/admin/login` - Admin login

### Products (Public)

- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product by ID with variants

### Admin Products

- `GET /api/admin/products` - List all products (admin)
- `GET /api/admin/products/:id` - Get product details (admin)
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/:productId/variants` - Create variant
- `PUT /api/admin/products/variants/:variantId` - Update variant
- `DELETE /api/admin/products/variants/:variantId` - Delete variant
- `POST /api/admin/products/:productId/images/upload` - Upload product image
- `POST /api/admin/products/:productId/images` - Add image URL
- `PUT /api/admin/products/:productId/images/reorder` - Reorder images
- `DELETE /api/admin/products/images/:imageId` - Delete image
- `POST /api/admin/products/bulk-import` - Bulk import from CSV
- `GET /api/admin/products/bulk-export` - Export products to CSV
- `GET /api/admin/products/low-stock` - Get low stock products

### Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Order Intents (Pre-Payment)

- `POST /api/order-intents` - Create order intent
- `GET /api/order-intents/:id` - Get order intent details
- `GET /api/order-intents` - Get user's order intents
- `DELETE /api/order-intents/:id` - Cancel order intent

### Payments

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify-payment` - Verify payment signature
- `POST /api/payments/webhook` - Razorpay webhook handler
- `POST /api/payments/test-payment` - Simulate test payment (development only)

### Orders

- `POST /api/orders` - Create order (legacy, use order intents)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/invoice` - Download order invoice
- `PUT /api/orders/:id/status` - Update order status (customer)

### Admin Orders

- `GET /api/admin/orders` - Get all orders (admin)
- `GET /api/admin/orders/:id` - Get order details (admin)
- `PUT /api/admin/orders/:id/status` - Update order status (admin)
- `GET /api/admin/orders/:id/invoice` - Get order invoice (admin)

### Addresses

- `GET /api/addresses` - Get user's addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Wishlist

- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add product to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist
- `GET /api/wishlist/check/:productId` - Check if product in wishlist

### Discounts

- `POST /api/discounts/validate` - Validate discount code (public)
- `GET /api/discounts` - Get all discounts (admin)
- `POST /api/discounts` - Create discount (admin)
- `PUT /api/discounts/:id` - Update discount (admin)
- `DELETE /api/discounts/:id` - Delete discount (admin)

### Reviews

- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews/product/:productId` - Create review
- `DELETE /api/reviews/:reviewId` - Delete review

### Delivery

- `GET /api/delivery/check` - Check delivery availability

### Shipments

- `POST /api/shipments/:orderId/create` - Create shipment (admin)
- `GET /api/shipments/:orderId` - Get shipment details
- `GET /api/shipments/:orderId/tracking` - Get tracking information
- `PUT /api/shipments/:orderId` - Update shipment details (admin)

### Returns

- `POST /api/returns` - Create return request
- `GET /api/returns` - Get user's return requests
- `GET /api/returns/order/:orderId` - Get return request by order
- `GET /api/returns/:id` - Get return request details

### Admin Returns

- `GET /api/admin/returns` - Get all return requests (admin)
- `GET /api/admin/returns/:id` - Get return request details (admin)
- `PUT /api/admin/returns/:id/approve` - Approve return request
- `PUT /api/admin/returns/:id/reject` - Reject return request
- `PUT /api/admin/returns/:id/received` - Mark item as received
- `PUT /api/admin/returns/:id/refund` - Initiate refund
- `PUT /api/admin/returns/:id/complete` - Complete refund

### Admin Dashboard

- `GET /api/admin/health` - Admin health check
- `GET /api/admin/dashboard/kpis` - Get dashboard KPIs
- `GET /api/admin/analytics/revenue-by-metal` - Revenue by metal type
- `GET /api/admin/analytics/sales-comparison` - Sales comparison analytics

### Admin Settings

- `GET /api/admin/settings` - Get all admin settings
- `GET /api/admin/settings/:key` - Get specific setting
- `PUT /api/admin/settings/:key` - Update setting
- `PUT /api/admin/settings/bulk` - Bulk update settings

### Admin Users

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/roles/admin` - Grant admin role
- `DELETE /api/admin/users/:userId/roles/admin` - Revoke admin role

### Admin Audit Logs

- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/audit-logs/:id` - Get audit log details
- `GET /api/admin/audit-logs/entity/:entityType/:entityId` - Get entity audit logs
- `GET /api/admin/audit-logs/stats` - Get audit statistics

### Admin Inventory

- `GET /api/admin/inventory/locks` - Get inventory locks
- `GET /api/admin/inventory/locks/:orderIntentId` - Get locks for order intent
- `POST /api/admin/inventory/release-expired` - Release expired locks

### Admin Abandoned Carts

- `GET /api/admin/abandoned-carts` - Get abandoned carts
- `GET /api/admin/abandoned-carts/:id` - Get abandoned cart details

### Pricing Rules

- `GET /api/admin/pricing-rules` - Get all pricing rules
- `POST /api/admin/pricing-rules` - Create pricing rule
- `PUT /api/admin/pricing-rules/:id` - Update pricing rule
- `DELETE /api/admin/pricing-rules/:id` - Delete pricing rule

### Product Pairings

- `GET /api/product-pairings/product/:productId` - Get paired products
- `POST /api/product-pairings` - Create pairing (admin)
- `DELETE /api/product-pairings/:pairingId` - Delete pairing (admin)

## Authentication in Swagger

To test protected endpoints in Swagger UI:

1. Click the **Authorize** button (lock icon) at the top of the Swagger UI
2. Enter your JWT token (obtained from login endpoints)
3. Click **Authorize**
4. Now you can test all protected endpoints

### Getting a Token

**For Admin:**
1. Use the `POST /api/auth/admin/login` endpoint
2. Enter admin email and password
3. Copy the `token` from the response
4. Use it in the Authorize dialog

**For Customer:**
1. Use the `POST /api/auth/login` endpoint
2. Enter customer email and password
3. Copy the `token` from the response
4. Use it in the Authorize dialog

**Note**: Tokens expire after a set period. If you get 401 errors, re-authenticate and update the token.

## Features

- **Interactive Testing**: Test all endpoints directly from the browser
- **Request/Response Examples**: See example payloads for all endpoints
- **Schema Definitions**: View data models and structures
- **Authentication Support**: JWT bearer token authentication
- **Organized by Tags**: Endpoints grouped by functionality
- **Try It Out**: Execute API calls directly from the documentation
- **Response Codes**: See all possible response codes and their meanings

## Data Models (Schemas)

The Swagger documentation includes comprehensive data models:

- **Product**: Product information with all fields
- **ProductVariant**: Product variant details
- **Order**: Order information
- **OrderIntent**: Pre-payment order intent
- **CartItem**: Shopping cart item
- **Address**: User address
- **Review**: Product review
- **InventoryLock**: Inventory lock information
- **AdminSetting**: System configuration setting
- **AbandonedCart**: Abandoned cart tracking
- **PaymentOrder**: Razorpay order details
- **PaymentVerification**: Payment verification response
- **ReturnRequest**: Return request details
- **Shipment**: Shipment and tracking information
- **DeliveryZone**: Delivery zone configuration
- **AuditLog**: Audit log entry
- **Error**: Error response format

## Adding More Documentation

To add Swagger documentation to new routes, use JSDoc comments in your route files:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     description: Detailed description of what this endpoint does
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/your-endpoint', yourController);
```

## Best Practices

1. **Always document new endpoints**: Add Swagger JSDoc comments when creating new routes
2. **Use existing schemas**: Reference existing schemas using `$ref: '#/components/schemas/SchemaName'`
3. **Document all parameters**: Include path, query, and body parameters
4. **Document responses**: Include all possible response codes (200, 400, 401, 404, 500, etc.)
5. **Use appropriate tags**: Group related endpoints using tags
6. **Mark security requirements**: Use `security: - bearerAuth: []` for protected endpoints

## Troubleshooting

### Swagger UI Not Loading

- Verify server is running: `http://localhost:3000/health`
- Check browser console for errors
- Ensure `swagger-jsdoc` and `swagger-ui-express` are installed
- Restart the server after installing dependencies

### Endpoints Not Showing

- Verify JSDoc comments are correctly formatted
- Check that route files are in `./src/routes/` directory
- Ensure `apis` path in `swagger.js` includes your route files
- Restart server after adding new documentation

### Authentication Not Working

- Verify token is valid (not expired)
- Check token format: should start with `Bearer ` in Authorization header
- Re-authenticate if token expired
- Verify user has required permissions (admin vs customer)

## Next Steps

1. Install dependencies: `npm install swagger-jsdoc swagger-ui-express` (if not already installed)
2. Start server: `npm run dev`
3. Visit `http://localhost:3000/api-docs`
4. Explore and test your API endpoints
5. Use the interactive documentation to understand request/response formats

The Swagger UI provides a complete interactive API testing environment for developers and API consumers.
