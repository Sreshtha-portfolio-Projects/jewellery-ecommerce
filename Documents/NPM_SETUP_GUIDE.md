# NPM Setup Guide - Complete Installation Instructions

This guide provides all npm commands needed to set up and run the Aldorado Jewells e-commerce platform.

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

Verify installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

---

## Complete Setup Process

### Step 1: Clone Repository (if not already done)

```bash
git clone <repository-url>
cd jewellery-ecommerce
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install all backend dependencies
npm install

# This installs:
# - @supabase/supabase-js (database client)
# - express (web framework)
# - cors (CORS middleware)
# - jsonwebtoken (JWT authentication)
# - bcryptjs (password hashing)
# - dotenv (environment variables)
# - multer (file uploads)
# - razorpay (payment gateway)
# - uuid (unique ID generation)
# - swagger-jsdoc & swagger-ui-express (API documentation)
# - csv-parse & csv-stringify (CSV handling)
# - nodemon (development server - dev dependency)
```

**Backend Dependencies Installed:**
- `@supabase/supabase-js` - Supabase client library
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `jsonwebtoken` - JWT token generation/verification
- `bcryptjs` - Password hashing
- `dotenv` - Environment variable management
- `multer` - File upload handling
- `razorpay` - Payment gateway integration
- `uuid` - UUID generation
- `swagger-jsdoc` - Swagger documentation generator
- `swagger-ui-express` - Swagger UI for API docs
- `csv-parse` - CSV parsing
- `csv-stringify` - CSV generation

**Dev Dependencies:**
- `nodemon` - Auto-restart server on file changes

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install all frontend dependencies
npm install

# This installs:
# - react & react-dom (React framework)
# - react-router-dom (routing)
# - axios (HTTP client)
# - react-hot-toast (toast notifications)
# - razorpay (Razorpay SDK - for frontend)
# - recharts (charts for admin dashboard)
# - vite (build tool)
# - tailwindcss (CSS framework)
# - eslint (code linting)
```

**Frontend Dependencies Installed:**
- `react` & `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls
- `react-hot-toast` - Toast notification library
- `razorpay` - Razorpay SDK (for payment integration)
- `recharts` - Chart library for analytics

**Dev Dependencies:**
- `@vitejs/plugin-react` - Vite React plugin
- `vite` - Build tool and dev server
- `tailwindcss` - Utility-first CSS framework
- `postcss` & `autoprefixer` - CSS processing
- `eslint` - Code linting
- `@types/react` & `@types/react-dom` - TypeScript types

---

## 🔧 Environment Setup

### Backend Environment Variables

Create `backend/.env` file:

```bash
cd backend
# Create .env file (copy from .env.example if exists)
```

Add these variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-secret-jwt-key-min-32-characters

# Admin Configuration
ALLOWED_ADMIN_EMAILS=admin@example.com,another-admin@example.com

# Razorpay Configuration (for payment integration)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Frontend Environment Variables

Create `frontend/.env` file:

```bash
cd frontend
# Create .env file
```

Add these variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
# For production: VITE_API_BASE_URL=https://api.valobuy.shop
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
# API docs available at http://localhost:3000/api-docs
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3 - ngrok (for webhook testing):**
```bash
# Only needed for Razorpay webhook testing in development
ngrok http 3000
# Copy the HTTPS URL and use it in Razorpay webhook settings
```

### Production Build

**Backend:**
```bash
cd backend
npm start
# Uses: node src/server.js
```

**Frontend:**
```bash
cd frontend
npm run build
# Creates optimized build in frontend/dist/
npm run preview
# Preview production build locally
```

---

## 📦 Package Management Commands

### Backend Commands

```bash
cd backend

# Install dependencies
npm install

# Install specific package
npm install <package-name>

# Install dev dependency
npm install --save-dev <package-name>

# Update all packages
npm update

# Check outdated packages
npm outdated

# Remove package
npm uninstall <package-name>

# Run development server (with auto-reload)
npm run dev

# Run production server
npm start

# Run tests (if configured)
npm test
```

### Frontend Commands

```bash
cd frontend

# Install dependencies
npm install

# Install specific package
npm install <package-name>

# Install dev dependency
npm install --save-dev <package-name>

# Update all packages
npm update

# Check outdated packages
npm outdated

# Remove package
npm uninstall <package-name>

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Common Workflows

### Fresh Installation (New Machine)

```bash
# 1. Clone repository
git clone <repository-url>
cd jewellery-ecommerce

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Set up environment variables (see above)

# 5. Run migrations in Supabase dashboard

# 6. Start development servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### After Pulling Latest Changes

```bash
# Pull latest code
git pull

# Update backend dependencies (if package.json changed)
cd backend
npm install

# Update frontend dependencies (if package.json changed)
cd ../frontend
npm install

# Restart servers
```

### Adding a New Package

**Backend:**
```bash
cd backend
npm install <package-name>
# Example: npm install express-validator
```

**Frontend:**
```bash
cd frontend
npm install <package-name>
# Example: npm install date-fns
```

---

## Database Migrations

After installing dependencies, run database migrations:

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in this order:
   - `migrations/supabase-setup.sql`
   - `migrations/supabase-schema-extensions.sql`
   - `migrations/supabase-product-variants-pricing.sql`
   - `migrations/supabase-product-features-extensions.sql`
   - `migrations/supabase-order-intent-inventory.sql`
   - `migrations/supabase-payment-shipping-extensions.sql`
   - `migrations/add-razorpay-order-id-to-intents.sql`

---

## 🧪 Testing Setup

### Install Testing Dependencies (Optional)

**Backend:**
```bash
cd backend
npm install --save-dev jest supertest
```

**Frontend:**
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

---

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port already in use

**Solution:**
```bash
# Backend - change PORT in .env
PORT=3001

# Frontend - Vite will automatically use next available port
# Or specify: npm run dev -- --port 5174
```

### Issue: Module not found errors

**Solution:**
```bash
# Make sure you're in the correct directory
cd backend  # or cd frontend

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Permission errors (Linux/Mac)

**Solution:**
```bash
# Don't use sudo with npm
# Fix npm permissions instead:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

## Dependency Overview

### Backend Dependencies (Production)
- **@supabase/supabase-js** - Database client
- **express** - Web framework
- **cors** - CORS handling
- **jsonwebtoken** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **multer** - File uploads
- **razorpay** - Payment gateway
- **uuid** - UUID generation
- **swagger-jsdoc** - API documentation
- **swagger-ui-express** - API docs UI
- **csv-parse** - CSV parsing
- **csv-stringify** - CSV generation

### Frontend Dependencies (Production)
- **react** & **react-dom** - UI framework
- **react-router-dom** - Routing
- **axios** - HTTP client
- **react-hot-toast** - Notifications
- **razorpay** - Payment SDK
- **recharts** - Charts

---

## Verification Checklist

After installation, verify everything works:

```bash
# 1. Check Node.js version
node --version

# 2. Check npm version
npm --version

# 3. Verify backend dependencies
cd backend
npm list --depth=0

# 4. Verify frontend dependencies
cd ../frontend
npm list --depth=0

# 5. Test backend server
cd ../backend
npm run dev
# Should see: "Server running on port 3000"

# 6. Test frontend server
cd ../frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

---

## Quick Reference

### Most Common Commands

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Both (in separate terminals)
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

### Update All Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Clean Install (if issues occur)

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Related Documentation

- [Razorpay Payment Integration Guide](./RAZORPAY_PAYMENT_INTEGRATION.md)
- [Razorpay Testing Guide](./RAZORPAY_TESTING_GUIDE.md)
- [Order Intent Implementation](./ORDER_INTENT_IMPLEMENTATION.md)
- [Product Management Guide](./ADMIN_PRODUCT_MANAGEMENT_IMPLEMENTATION.md)
- [Swagger API Documentation Setup](./SWAGGER_SETUP.md)

---

## Tips

1. **Always run `npm install` after pulling code** - Dependencies may have changed
2. **Use `npm run dev` for development** - Auto-reloads on file changes
3. **Check `.env` files** - Make sure all required variables are set
4. **Run migrations in order** - Database migrations must be run sequentially
5. **Keep dependencies updated** - Run `npm update` regularly for security patches

---

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify all environment variables are set
3. Ensure Node.js version is 18+
4. Try clean install (remove node_modules and reinstall)
5. Check the troubleshooting section above

