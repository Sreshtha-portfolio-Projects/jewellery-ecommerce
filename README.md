# Aldorado Jewells - Luxury Jewelry E-commerce Platform

A full-stack luxury jewelry e-commerce platform built with React, Node.js, Express, and Supabase. Features complete product management, order processing, Razorpay payment integration, and admin dashboard.

## 🏗️ Architecture

```
Frontend (React/Vite) → Backend (Node.js/Express) → Supabase (PostgreSQL + Auth + Storage)
```

**Important**: The frontend never communicates directly with Supabase. All database operations go through the Node.js backend API for security and data consistency.

## 📁 Project Structure

```
jewellery-ecommerce/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (admin, customer, public)
│   │   ├── layouts/       # Layout components
│   │   ├── services/      # API service layer
│   │   ├── context/       # React context (Auth, Cart)
│   │   ├── utils/         # Utility functions (toast, etc.)
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── config/        # Configuration (Supabase, Razorpay, Swagger)
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/   # Express middleware (auth, etc.)
│   │   ├── services/      # Business logic services
│   │   └── server.js      # Entry point
│   └── package.json
│
├── migrations/            # Database migration files
│   ├── supabase-setup.sql
│   ├── supabase-schema-extensions.sql
│   ├── supabase-product-variants-pricing.sql
│   ├── supabase-order-intent-inventory.sql
│   ├── supabase-payment-shipping-extensions.sql
│   └── add-razorpay-order-id-to-intents.sql
│
└── Documents/            # Documentation
    ├── SETUP.md                     # Full setup guide (includes quick start)
    ├── DEPLOYMENT_GUIDE.md          # Vercel + Render deployment
    ├── NPM_SETUP_GUIDE.md           # NPM commands and reference
    ├── RAZORPAY_PAYMENT_INTEGRATION.md  # Payment setup and testing
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Supabase account** - [Sign up](https://supabase.com)
- **Razorpay account** (for payments) - [Sign up](https://razorpay.com)

### Installation

**1. Clone the repository:**
```bash
git clone <repository-url>
cd jewellery-ecommerce
```

**2. Install Backend Dependencies:**
```bash
cd backend
npm install
```

**3. Install Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

**4. Set up environment variables:**

**Backend** (`backend/.env`):
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-jwt-key-min-32-characters
ALLOWED_ADMIN_EMAILS=admin@example.com
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

**5. Run database migrations:**

Go to Supabase Dashboard → SQL Editor and run migrations in order:
1. `migrations/supabase-setup.sql`
2. `migrations/supabase-schema-extensions.sql`
3. `migrations/supabase-product-variants-pricing.sql`
4. `migrations/supabase-product-features-extensions.sql`
5. `migrations/supabase-order-intent-inventory.sql`
6. `migrations/supabase-payment-shipping-extensions.sql`
7. `migrations/add-razorpay-order-id-to-intents.sql`

**6. Start the application:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
# API docs: http://localhost:3000/api-docs
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3 - ngrok (for webhook testing):**
```bash
ngrok http 3000
# Use the HTTPS URL in Razorpay webhook settings
```

## 📚 Detailed Setup Guide

For complete installation instructions, see: **[NPM_SETUP_GUIDE.md](./Documents/NPM_SETUP_GUIDE.md)**

## 🎨 Features

### Customer Features
- **Product Browsing**: Browse products by category, search, filter
- **Product Details**: Detailed product pages with variants, images, reviews
- **Shopping Cart**: Add to cart, update quantities, remove items
- **Wishlist**: Save favorite products
- **User Authentication**: Sign up, login, password reset
- **Address Management**: Multiple shipping addresses
- **Order Management**: View order history, track orders
- **Reviews & Ratings**: Product reviews and ratings
- **Payment Integration**: Razorpay payment gateway (UPI, Cards, Net Banking, Wallets)

### Admin Features
- **Admin Dashboard**: KPIs, revenue analytics, order management
- **Product Management**: CRUD operations, bulk import/export
- **Product Variants**: Size, color, finish variants with individual pricing
- **Image Management**: Multiple product images, primary image selection
- **Inventory Management**: Stock tracking, inventory locks, low stock alerts
- **Order Management**: View all orders, update status, process shipments
- **Pricing Rules**: Dynamic pricing based on metal type, weight, category
- **Discount Management**: Create and manage coupon codes
- **Settings**: Configure tax, shipping, inventory lock duration
- **Analytics**: Revenue by metal type, order statistics, abandoned carts

### Technical Features
- **Order Intent System**: Inventory locking before payment
- **Payment Integration**: Razorpay with webhook verification
- **Stock Management**: Product and variant-level stock tracking
- **Price Calculation**: Dynamic pricing with rules engine
- **Cart Validation**: Real-time cart revalidation
- **Toast Notifications**: User-friendly notifications
- **Responsive Design**: Mobile-first, luxury aesthetic

## 📡 API Documentation

### Swagger UI

Access interactive API documentation at:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://api.valobuy.shop/api-docs`

### Key API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Customer signup
- `POST /api/auth/login` - Customer/Admin login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user

**Products:**
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product details
- `GET /api/admin/products` - Admin: Get all products
- `POST /api/admin/products` - Admin: Create product
- `PUT /api/admin/products/:id` - Admin: Update product
- `DELETE /api/admin/products/:id` - Admin: Delete product

**Cart:**
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove from cart

**Order Intents:**
- `POST /api/order-intents` - Create order intent (locks inventory)
- `GET /api/order-intents` - Get user's order intents
- `GET /api/order-intents/:id` - Get order intent details

**Payments:**
- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify-payment` - Verify payment and create order
- `POST /api/payments/webhook` - Razorpay webhook handler

**Orders:**
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

**Addresses:**
- `GET /api/addresses` - Get user's addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

For complete API documentation, visit `/api-docs` when the server is running.

## 🔐 Authentication

### Customer Authentication
1. User signs up or logs in via `/api/auth/signup` or `/api/auth/login`
2. Backend verifies credentials with Supabase Auth
3. Backend issues JWT token
4. Frontend stores token and includes it in `Authorization: Bearer <token>` header

### Admin Authentication
1. Admin logs in via `/api/auth/admin/login`
2. Backend checks if email is in `ALLOWED_ADMIN_EMAILS` or has `role="admin"` in metadata
3. Backend issues JWT token with `role: "admin"`
4. Admin routes require `requireAdmin` middleware

## 💳 Payment Flow

1. **Create Order Intent**: Locks inventory and prices
2. **Create Razorpay Order**: Backend creates payment order
3. **Open Razorpay Checkout**: Frontend opens payment modal
4. **Process Payment**: User completes payment via Razorpay
5. **Verify Payment**: Backend verifies payment signature
6. **Convert Intent to Order**: Order created only after payment confirmation
7. **Webhook Confirmation**: Razorpay webhook confirms payment (idempotent)

For detailed payment integration guide, see: **[RAZORPAY_PAYMENT_INTEGRATION.md](./Documents/RAZORPAY_PAYMENT_INTEGRATION.md)**

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **react-hot-toast** - Toast notifications
- **Razorpay SDK** - Payment integration
- **Recharts** - Charts for analytics

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **Supabase JS SDK** - Database client
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Razorpay** - Payment gateway SDK
- **Multer** - File upload handling
- **Swagger** - API documentation
- **UUID** - Unique ID generation

### Database & Services
- **Supabase** - PostgreSQL database
- **Supabase Auth** - User authentication
- **Supabase Storage** - Image storage
- **Razorpay** - Payment gateway

## 📝 Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-secret-jwt-key-min-32-characters
ALLOWED_ADMIN_EMAILS=admin@example.com,another@example.com

# Razorpay (Payment Integration)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Frontend (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
# Production: VITE_API_BASE_URL=https://api.valobuy.shop
```

## 📦 NPM Commands

### Backend

```bash
cd backend

# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start

# Check outdated packages
npm outdated

# Update packages
npm update
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

For complete npm commands guide, see: **[NPM_SETUP_GUIDE.md](./Documents/NPM_SETUP_GUIDE.md)**

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following main tables:

- `products` - Product catalog
- `product_variants` - Product variants (size, color, etc.)
- `product_images` - Product images
- `carts` - Shopping cart items
- `order_intents` - Pre-payment order intents (locks inventory)
- `orders` - Completed orders
- `order_items` - Order line items
- `addresses` - User shipping addresses
- `discounts` - Coupon codes
- `reviews` - Product reviews
- `inventory_locks` - Inventory reservations
- `admin_settings` - System configuration
- `pricing_rules` - Dynamic pricing rules

Run migrations in `migrations/` folder in order.

## 🧪 Testing

### Payment Testing

Use Razorpay test cards:
- **Success**: `4111 1111 1111 1111` (any CVV, any future date)
- **Failure**: `4000 0000 0000 0002`
- **Test UPI**: `success@razorpay` or `failure@razorpay`

For setup and testing, see: **[RAZORPAY_PAYMENT_INTEGRATION.md](./Documents/RAZORPAY_PAYMENT_INTEGRATION.md)** (includes quick setup and testing sections).

## 📖 Documentation

- **[NPM Setup Guide](./Documents/NPM_SETUP_GUIDE.md)** - Installation and NPM reference
- **[Razorpay Payment Integration](./Documents/RAZORPAY_PAYMENT_INTEGRATION.md)** - Payment setup and testing
- **[Order Intent Implementation](./Documents/ORDER_INTENT_IMPLEMENTATION.md)** - Order intent system
- **[Admin Product Management](./Documents/IMPLEMENTATION_COMPLETE.md)** - Admin product management
- **[Swagger Setup](./Documents/SWAGGER_SETUP.md)** - API documentation setup

## 🎨 Design Philosophy

The platform follows a luxury jewelry brand aesthetic:
- **Soft beige and cream** backgrounds
- **Rose-gold and muted gold** accents
- **Elegant typography** (serif + sans-serif pairing)
- **Generous white space**
- **Subtle hover effects** and transitions
- **Editorial-style** product layouts
- **Toast notifications** instead of alerts

## 🔒 Security Features

- JWT-based authentication
- Row Level Security (RLS) in Supabase
- Server-side only Supabase access
- Payment signature verification
- Webhook signature validation
- Environment variable protection
- CORS configuration
- Input validation and sanitization

## 🚀 Deployment

For a complete step-by-step deployment guide, see: **[DEPLOYMENT_GUIDE.md](./Documents/DEPLOYMENT_GUIDE.md)**

The deployment guide covers:
- ✅ Deploying backend to Render
- ✅ Deploying frontend to Vercel
- ✅ Configuring Razorpay webhooks
- ✅ Setting up Cloudflare (optional)
- ✅ Custom domain configuration
- ✅ Troubleshooting common issues

### Quick Overview

**Backend (Render):**
1. Set `NODE_ENV=production` in environment variables
2. Configure all required environment variables (Supabase, JWT, Razorpay)
3. Deploy as Web Service on Render

**Frontend (Vercel):**
1. Set `VITE_API_BASE_URL` to production API URL
2. Connect GitHub repository
3. Deploy with Vite preset

**After Initial Deployment:**
1. Configure Razorpay webhooks
2. Set up custom domains (optional)
3. Configure Cloudflare (optional)

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change PORT in backend/.env
PORT=3001
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Payment webhook not working:**
- Ensure ngrok/cloudflared is running
- Verify webhook URL in Razorpay dashboard
- Check webhook secret matches `.env`

For more troubleshooting, see: **[NPM_SETUP_GUIDE.md](./Documents/NPM_SETUP_GUIDE.md)**

## 📄 License

This project is private and proprietary.

## 👥 Support

For issues or questions:
- Check documentation in `Documents/` folder
- Review API documentation at `/api-docs`
- Contact: support@aldoradojewells.com

---

**Built with ❤️ for Aldorado Jewells**
