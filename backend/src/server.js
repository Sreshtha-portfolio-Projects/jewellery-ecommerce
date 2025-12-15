const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const discountRoutes = require('./routes/discountRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const productPairingRoutes = require('./routes/productPairingRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminPricingRoutes = require('./routes/adminPricingRoutes');
const orderIntentRoutes = require('./routes/orderIntentRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const adminInventoryRoutes = require('./routes/adminInventoryRoutes');
const { cartActivityRouter, adminAbandonedCartRouter } = require('./routes/abandonedCartRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching for API responses (especially important in development)
app.use((req, res, next) => {
  // Disable caching for all API routes
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': false
  });
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Aldorado Jewells API Documentation'
}));

// API Routes
app.use('/api/auth/admin', authRoutes); // Admin login
app.use('/api/auth', customerAuthRoutes); // Customer auth (unified)
app.use('/api/auth/customer', customerAuthRoutes); // Customer auth (legacy, for backward compatibility)
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/product-pairings', productPairingRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/pricing-rules', adminPricingRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);
app.use('/api/admin', adminAbandonedCartRouter);
app.use('/api/order-intents', orderIntentRoutes);
app.use('/api', cartActivityRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Aldorado Jewells API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      debug: '/api/debug/routes',
      products: '/api/products',
      auth: {
        customer: {
          signup: 'POST /api/auth/signup',
          login: 'POST /api/auth/login',
          google: 'POST /api/auth/google',
          googleCallback: 'GET /api/auth/google/callback',
          forgotPassword: 'POST /api/auth/forgot-password',
          logout: 'POST /api/auth/logout',
          me: 'GET /api/auth/me',
          profile: 'GET /api/auth/profile (legacy)'
        },
        admin: {
          login: 'POST /api/auth/admin/login'
        },
        legacy: '/api/auth/customer (backward compatibility)'
      },
      addresses: '/api/addresses',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      orders: '/api/orders',
      discounts: '/api/discounts',
      admin: '/api/admin'
    }
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Debug endpoint to list registered routes
app.get('/api/debug/routes', (req, res) => {
  try {
    const routes = [];
    
    // Function to extract path from regexp
    const getPathFromRegex = (regex) => {
      if (!regex) return '';
      let path = regex.toString()
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\$/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\\/g, '');
      
      // Extract actual path from regex groups
      const match = regex.toString().match(/\^([^$]+)\$/);
      if (match) {
        path = match[1]
          .replace(/\\\//g, '/')
          .replace(/\\/g, '')
          .replace(/\?/g, '');
      }
      
      return path || '';
    };
    
    // Function to recursively get routes from router stack
    const getRoutes = (stack, basePath = '') => {
      if (!stack || !Array.isArray(stack)) return;
      
      stack.forEach((layer) => {
        try {
          if (layer.route) {
            // Direct route
            const methods = Object.keys(layer.route.methods || {}).filter(m => layer.route.methods[m]);
            if (methods.length > 0) {
              const path = basePath + (layer.route.path || '');
              methods.forEach(method => {
                routes.push(`${method.toUpperCase()} ${path}`);
              });
            }
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            // Router middleware - extract base path
            let routerPath = basePath;
            if (layer.regexp) {
              const extracted = getPathFromRegex(layer.regexp);
              if (extracted && extracted !== basePath) {
                routerPath = extracted;
              }
            }
            // Recursively get routes from nested router
            getRoutes(layer.handle.stack, routerPath);
          }
        } catch (err) {
          // Skip invalid layers
        }
      });
    };
    
    // Get routes from app
    if (app._router && app._router.stack) {
      getRoutes(app._router.stack);
    } else if (app.routes) {
      // Fallback for older Express versions
      Object.keys(app.routes).forEach(method => {
        app.routes[method].forEach(route => {
          routes.push(`${method.toUpperCase()} ${route.path}`);
        });
      });
    }
    
    // If still no routes, provide manual list from server.js
    if (routes.length === 0) {
      routes.push(
        'GET /',
        'GET /health',
        'GET /api/debug/routes',
        'POST /api/auth/signup',
        'POST /api/auth/login',
        'POST /api/auth/google',
        'GET /api/auth/google/callback',
        'POST /api/auth/forgot-password',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'GET /api/auth/profile',
        'POST /api/auth/admin/login',
        'GET /api/products',
        'GET /api/products/:id',
        'GET /api/addresses',
        'POST /api/addresses',
        'PUT /api/addresses/:id',
        'DELETE /api/addresses/:id',
        'GET /api/cart',
        'POST /api/cart',
        'PUT /api/cart/:id',
        'DELETE /api/cart/:id',
        'GET /api/wishlist',
        'POST /api/wishlist',
        'DELETE /api/wishlist/:productId',
        'GET /api/wishlist/check/:productId',
        'POST /api/orders',
        'GET /api/orders',
        'GET /api/orders/:id',
        'PUT /api/orders/:id/status',
        'POST /api/discounts/validate',
        'GET /api/discounts',
        'POST /api/discounts',
        'PUT /api/discounts/:id',
        'DELETE /api/discounts/:id',
        'GET /api/admin/health',
        'GET /api/admin/dashboard/kpis',
        'GET /api/admin/analytics/revenue-by-metal',
        'GET /api/admin/analytics/sales-comparison',
        'GET /api/admin/products/low-stock',
        'GET /api/admin/orders',
        'GET /api/admin/orders/:id'
      );
    }
    
    res.json({ 
      routes: routes.sort(), 
      message: routes.length > 0 ? 'Registered routes' : 'Using manual route list (router introspection unavailable)',
      count: routes.length 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error listing routes', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err && err.stack) {
    console.error('Error stack:', err.stack);
  }
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(500).json({ 
    message: 'Internal server error',
    ...(isDevelopment && err && { error: err.message, stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

