const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const discountRoutes = require('./routes/discountRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Poor Gem API Server',
    version: '1.0.0',
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

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Debug endpoint to list registered routes
app.get('/api/debug/routes', (req, res) => {
  try {
    const routes = [];
    
    if (!app._router || !app._router.stack) {
      return res.json({ routes: [], message: 'No routes registered yet' });
    }
    
    app._router.stack.forEach((middleware) => {
      try {
        if (middleware.route) {
          // Direct route
          const methods = Object.keys(middleware.route.methods || {}).join(', ').toUpperCase();
          if (methods) {
            routes.push(`${methods} ${middleware.route.path || ''}`);
          }
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
          // Router middleware
          const basePath = middleware.regexp 
            ? middleware.regexp.source
                .replace('\\/?', '')
                .replace('(?=\\/|$)', '')
                .replace(/\\\//g, '/')
                .replace(/\^/g, '')
                .replace(/\$/g, '')
                .replace(/\(/g, '')
                .replace(/\)/g, '')
            : '';
          
          middleware.handle.stack.forEach((handler) => {
            try {
              if (handler.route) {
                const methods = Object.keys(handler.route.methods || {}).join(', ').toUpperCase();
                if (methods) {
                  routes.push(`${methods} ${basePath}${handler.route.path || ''}`);
                }
              }
            } catch (err) {
              // Skip invalid handlers
            }
          });
        }
      } catch (err) {
        // Skip invalid middleware
      }
    });
    
    res.json({ routes, message: 'Registered routes', count: routes.length });
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

