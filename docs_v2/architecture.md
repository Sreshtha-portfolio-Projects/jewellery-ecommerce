# System Architecture

## Overview

Aldorado Jewells follows a three-tier architecture with strict separation between frontend, backend, and database layers.

```
Frontend (React) → Backend (Node.js/Express) → Supabase (PostgreSQL + Auth + Storage)
```

## Architecture Principles

### Backend-First Design

The frontend never communicates directly with Supabase. All database operations go through the Node.js backend API. This ensures:

- Security: Service role keys never exposed to clients
- Data consistency: Single source of truth for business logic
- Auditability: All data changes go through controlled endpoints
- Flexibility: Backend can enforce business rules before database operations

### Configuration-Driven Business Logic

Business rules are stored in the `admin_settings` table and configurable via the admin panel:

- Tax percentages
- Shipping charges and thresholds
- State machine transitions
- Inventory lock durations
- Return windows

No business logic is hardcoded in the application code.

### Immutable Audit Trail

All critical actions are logged in the `audit_logs` table:

- Order status changes
- Shipping status updates
- Return approvals and rejections
- Refund processing
- Admin login attempts

Audit logs are immutable (no updates or deletes allowed) and provide a complete history of system changes.

## Technology Stack

### Frontend

- **React 19**: UI framework
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **react-hot-toast**: Toast notifications
- **Razorpay SDK**: Payment integration
- **Recharts**: Analytics charts

### Backend

- **Node.js**: Runtime environment
- **Express 5**: Web framework
- **Supabase JS SDK**: Database client
- **JWT**: Authentication tokens (jsonwebtoken)
- **bcryptjs**: Password hashing
- **Razorpay**: Payment gateway SDK
- **Multer**: File upload handling
- **Swagger**: API documentation

### Database & Services

- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **Supabase Auth**: User authentication and authorization
- **Supabase Storage**: Image and file storage
- **Razorpay**: Payment gateway

## Project Structure

```
jewellery-ecommerce/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (admin, customer, public)
│   │   ├── layouts/      # Layout components
│   │   ├── services/     # API service layer
│   │   ├── context/      # React context (Auth, Cart)
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   └── package.json
│
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── config/       # Configuration (Supabase, Razorpay, Swagger)
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware (auth, etc.)
│   │   ├── services/     # Business logic services
│   │   └── server.js     # Entry point
│   └── package.json
│
├── migrations/            # Database migration files
│   ├── supabase-setup.sql
│   ├── supabase-schema-extensions.sql
│   ├── supabase-product-variants-pricing.sql
│   ├── supabase-order-intent-inventory.sql
│   ├── supabase-payment-shipping-extensions.sql
│   └── add-state-machine-configs.sql
│
└── docs_v2/               # Documentation
    ├── README.md
    ├── architecture.md
    ├── core-flows.md
    ├── admin-operations.md
    ├── testing-guide.md
    ├── production-readiness.md
    └── known-limitations.md
```

## Database Schema

### Core Tables

- **products**: Product catalog with base information
- **product_variants**: Variants (size, color, finish) with individual pricing and stock
- **product_images**: Product and variant images
- **carts**: Shopping cart items
- **order_intents**: Pre-payment order intents (locks inventory)
- **orders**: Completed orders
- **order_items**: Order line items with price snapshots
- **addresses**: User shipping addresses
- **discounts**: Coupon codes
- **reviews**: Product reviews
- **inventory_locks**: Inventory reservations
- **admin_settings**: System configuration
- **pricing_rules**: Dynamic pricing rules
- **audit_logs**: Immutable audit trail
- **shipping_status_history**: Shipping status change history
- **return_requests**: Return and refund requests

### Row Level Security (RLS)

All tables have RLS policies enabled:

- Users can only access their own data (orders, carts, addresses)
- Admins have elevated access via service role key
- Public tables (products) allow read access to all
- Audit logs are read-only for all users

## Authentication & Authorization

### Customer Authentication

1. User signs up or logs in via `/api/auth/signup` or `/api/auth/login`
2. Backend verifies credentials with Supabase Auth
3. Backend issues JWT token with user ID and role
4. Frontend stores token in localStorage
5. Frontend includes token in `Authorization: Bearer <token>` header for protected routes

### Admin Authentication

1. Admin logs in via `/api/auth/admin/login`
2. Backend checks if email is in `ALLOWED_ADMIN_EMAILS` or user has `role="admin"` in database
3. Backend issues JWT token with `role: "admin"`
4. Admin routes require `requireAdmin` middleware
5. Admin actions are logged in audit_logs

### Token Management

- Tokens are stateless JWT tokens
- Token expiration is configurable
- Invalid or expired tokens return 403
- Frontend clears invalid tokens and redirects to login

## Security Features

### Authentication Security

- JWT-based stateless authentication
- Token expiration enforced
- Token tampering detected via signature verification
- Missing tokens blocked with 401 response

### Authorization Security

- Admin-only routes protected with `requireAdmin` middleware
- User data isolation enforced (users can only access their own data)
- Order ownership validated before access
- Cart ownership validated

### Input Validation

- SQL injection prevented via parameterized queries (Supabase SDK)
- XSS attacks prevented via React's automatic content escaping
- Invalid UUIDs handled gracefully (404 response)
- Empty inputs validated before processing

### State Machine Enforcement

- Order status transitions validated
- Shipping status transitions validated
- Return status transitions validated
- Invalid transitions rejected with clear error messages

### Error Handling

- Sensitive data not exposed in error messages
- User-friendly error messages for clients
- Stack traces hidden in production
- Graceful degradation implemented

## Data Flow

### Order Creation Flow

1. User adds items to cart (stored in database)
2. User proceeds to checkout
3. Frontend calls `/api/order-intents` to create order intent
4. Backend validates cart, locks inventory, locks prices
5. Frontend calls `/api/payments/create-order` to create Razorpay order
6. User completes payment via Razorpay
7. Razorpay sends webhook to `/api/payments/webhook`
8. Backend verifies webhook signature
9. Backend converts order intent to order
10. Backend deducts inventory and clears cart

### Product Management Flow

1. Admin creates/updates product via `/api/admin/products`
2. Backend validates input and stores in database
3. Product images uploaded to Supabase Storage
4. Product variants managed separately
5. Changes logged in audit_logs
6. Frontend fetches products via `/api/products`

### Shipping Flow

1. Admin creates shipment via `/api/admin/shipping/:orderId/create`
2. Backend validates order is paid
3. Backend updates shipping status via state machine
4. Status change logged in shipping_status_history
5. Customer can view status via `/api/orders/:id`

## API Architecture

### RESTful Design

- Standard HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs (`/api/products/:id`)
- JSON request/response format
- Consistent error response format

### Endpoint Organization

- `/api/auth/*`: Authentication endpoints
- `/api/products`: Product endpoints (public)
- `/api/cart`: Cart management
- `/api/orders`: Order management
- `/api/addresses`: Address management
- `/api/admin/*`: Admin-only endpoints
- `/api/payments/*`: Payment endpoints

### Middleware Stack

1. CORS handling
2. Body parsing (JSON)
3. Authentication (`authenticateToken`)
4. Authorization (`requireAdmin` for admin routes)
5. Error handling

## Configuration Management

### Admin Settings

All configurable business rules stored in `admin_settings` table:

- Tax percentage
- Shipping charges
- Free shipping threshold
- Return window days
- Delivery days (min/max)
- Inventory lock duration
- State machine configurations

### Config Service

Centralized `configService.js` provides:

- Cached access to settings (1-minute TTL)
- Type-safe getters for different setting types
- State machine validation methods
- Automatic cache invalidation on updates

### Environment Variables

#### Backend Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (backend only, keep secret)
- `JWT_SECRET`: JWT signing secret (min 32 characters, use strong random value)
- `RAZORPAY_KEY_ID`: Razorpay key ID (starts with `rzp_test_` for test mode)
- `RAZORPAY_KEY_SECRET`: Razorpay secret key (keep secret)
- `RAZORPAY_WEBHOOK_SECRET`: Webhook verification secret (starts with `whsec_`)

Optional:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ADMIN_EMAILS`: Comma-separated admin emails (legacy, database method preferred)
- `FRONTEND_URL`: Frontend URL for CORS configuration

#### Frontend Environment Variables

Required:
- `VITE_API_BASE_URL`: Backend API URL (e.g., `http://localhost:3000` for local, production URL for production)

### Database Migrations

Run migrations in Supabase SQL Editor in this order:

1. `supabase-setup.sql` - Core schema
2. `supabase-schema-extensions.sql` - Extended schema
3. `supabase-product-variants-pricing.sql` - Product variants and pricing
4. `supabase-product-features-extensions.sql` - Product features
5. `supabase-order-intent-inventory.sql` - Order intents and inventory
6. `supabase-payment-shipping-extensions.sql` - Payment and shipping
7. `add-razorpay-order-id-to-intents.sql` - Razorpay integration
8. `add-state-machine-configs.sql` - State machine configurations
9. `ensure-audit-logs-immutable.sql` - Audit log immutability
10. `supabase-admin-roles.sql` - Admin role management
11. `improve-sku-management.sql` - SKU management
12. `add-returns-refunds-system.sql` - Returns and refunds
13. `add-shipping-state-machine.sql` - Shipping state machine
14. `add-delivery-days-settings.sql` - Delivery settings
15. `add-category-product-delivery-zones.sql` - Delivery zones

### Supabase Storage Setup

For product image storage:

1. Create storage bucket named `product-images` in Supabase Dashboard
2. Set bucket as public
3. Configure bucket policies for read/write access
4. Images stored at: `product-images/{productId}/{timestamp}-{random}.{ext}`

See `Documents/SETUP_SUPABASE_STORAGE.md` for detailed instructions.

### API Documentation (Swagger)

Swagger UI is available at `/api-docs` when backend is running.

To set up:
1. Install dependencies: `npm install swagger-jsdoc swagger-ui-express`
2. Access at: `http://localhost:3000/api-docs`
3. Use "Authorize" button to add JWT token for testing protected endpoints

See `Documents/SWAGGER_SETUP.md` for complete setup guide.

## Performance Considerations

### Database Queries

- Indexed columns for frequently queried fields
- Batch queries where possible (e.g., fetching multiple variants)
- Pagination for large result sets
- Efficient joins for related data

### Caching

- Config service caches admin settings (1-minute TTL)
- Frontend can cache product listings (with invalidation on updates)
- No caching of user-specific data (orders, cart)

### Image Handling

- Images stored in Supabase Storage
- Optimized image URLs for different sizes
- Lazy loading in frontend
- CDN delivery via Supabase

## Scalability

### Current Architecture

- Monolithic backend (single Node.js process)
- Single database instance (Supabase)
- Stateless API (can scale horizontally)

### Future Scalability Options

- Load balancing for backend instances
- Database read replicas for read-heavy operations
- Redis caching layer for frequently accessed data
- Microservices separation for independent scaling
- Event-driven architecture for async operations

## Monitoring & Observability

### Audit Logging

- All critical actions logged in `audit_logs`
- Includes user ID, action type, entity type, old/new values
- IP address and user agent for security
- Immutable logs for compliance

### Error Logging

- Console logging for development
- Structured error responses for clients
- Error context included in responses (development only)

### Health Checks

- `/health` endpoint for basic health check
- Database connectivity check
- External service status (Razorpay, Supabase)

## Deployment Architecture

### Frontend Deployment

- Deployed to Vercel (or similar static hosting)
- Environment variables set in deployment platform
- Automatic builds on git push
- CDN delivery for static assets

### Backend Deployment

- Deployed to Render (or similar Node.js hosting)
- Environment variables set in deployment platform
- Automatic deployments on git push
- Health check endpoint for monitoring

### Database

- Supabase managed PostgreSQL
- Automatic backups
- Point-in-time recovery
- Connection pooling

## Security Best Practices

1. **Never expose service role keys**: Only backend has access
2. **Validate all inputs**: Server-side validation for all user inputs
3. **Use parameterized queries**: Supabase SDK handles this automatically
4. **Enforce state machines**: Prevent invalid state transitions
5. **Log all admin actions**: Complete audit trail
6. **Verify webhook signatures**: Prevent fake webhooks
7. **Use HTTPS in production**: Encrypt all traffic
8. **Rotate secrets regularly**: JWT secrets, API keys
9. **Limit admin access**: Only grant admin role to trusted users
10. **Monitor audit logs**: Regular review of system changes

