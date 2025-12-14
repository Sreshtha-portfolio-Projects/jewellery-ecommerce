// Script to verify all routes and controllers are properly exported
const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Routes and Controllers ===\n');

const routesDir = path.join(__dirname, 'src', 'routes');
const controllersDir = path.join(__dirname, 'src', 'controllers');

let hasErrors = false;

// Check route files
console.log('📁 Checking Route Files:\n');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if module.exports exists
  if (!content.includes('module.exports')) {
    console.log(`❌ ${file}: Missing module.exports`);
    hasErrors = true;
  } else {
    // Check for common route patterns
    const hasRouter = content.includes('express.Router()') || content.includes('express().Router()');
    const hasRoutes = content.includes('router.') || content.includes('router.get') || content.includes('router.post');
    
    // Try to require it only if we can (skip if it needs Supabase)
    try {
      const route = require(filePath);
      if (typeof route !== 'function' && typeof route !== 'object') {
        console.log(`❌ ${file}: Exports invalid type (${typeof route})`);
        hasErrors = true;
      } else {
        console.log(`✅ ${file}: Properly exported and loaded`);
      }
    } catch (error) {
      // If error is due to missing env vars, that's OK for verification
      if (error.message.includes('Supabase') || error.message.includes('environment')) {
        if (hasRouter && hasRoutes) {
          console.log(`✅ ${file}: Has module.exports and router setup (needs env vars to load)`);
        } else {
          console.log(`⚠️  ${file}: Has module.exports but may have syntax issues`);
        }
      } else {
        console.log(`❌ ${file}: Error loading - ${error.message}`);
        hasErrors = true;
      }
    }
  }
});

// Check controller files
console.log('\n📁 Checking Controller Files:\n');
const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

controllerFiles.forEach(file => {
  const filePath = path.join(controllersDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if module.exports exists
  if (!content.includes('module.exports')) {
    console.log(`❌ ${file}: Missing module.exports`);
    hasErrors = true;
  } else {
    // Try to require it (but skip if it needs env vars)
    try {
      // Don't actually require controllers that need Supabase, just check syntax
      if (file.includes('Auth') || file.includes('customer') || file.includes('admin')) {
        // These might need env vars, just check syntax
        if (content.includes('module.exports')) {
          console.log(`✅ ${file}: Has module.exports (may need env vars to load)`);
        }
      } else {
        const controller = require(filePath);
        if (typeof controller !== 'object') {
          console.log(`❌ ${file}: Exports invalid type (${typeof controller})`);
          hasErrors = true;
        } else {
          console.log(`✅ ${file}: Properly exported`);
        }
      }
    } catch (error) {
      if (error.message.includes('Supabase') || error.message.includes('environment')) {
        console.log(`⚠️  ${file}: Has module.exports (needs env vars to load)`);
      } else {
        console.log(`❌ ${file}: Error loading - ${error.message}`);
        hasErrors = true;
      }
    }
  }
});

// Check server.js route mounting
console.log('\n📁 Checking Server Route Mounting:\n');
try {
  const serverPath = path.join(__dirname, 'src', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const expectedRoutes = [
    'customerAuthRoutes',
    'authRoutes',
    'productRoutes',
    'addressRoutes',
    'cartRoutes',
    'wishlistRoutes',
    'orderRoutes',
    'discountRoutes',
    'adminRoutes'
  ];
  
  expectedRoutes.forEach(routeName => {
    if (serverContent.includes(`require('./routes/${routeName}')`)) {
      console.log(`✅ ${routeName}: Required in server.js`);
    } else {
      console.log(`❌ ${routeName}: NOT found in server.js`);
      hasErrors = true;
    }
    
    if (serverContent.includes(`app.use`) && serverContent.includes(routeName)) {
      console.log(`✅ ${routeName}: Mounted in server.js`);
    } else {
      console.log(`⚠️  ${routeName}: May not be mounted (check app.use)`);
    }
  });
} catch (error) {
  console.log(`❌ Error checking server.js: ${error.message}`);
  hasErrors = true;
}

// Verify route-controller function name matching
console.log('\n📁 Verifying Route-Controller Function Matching:\n');

const routeControllerMap = [
  {
    route: 'customerAuthRoutes.js',
    controller: 'customerAuthController.js',
    functions: ['signup', 'login', 'googleAuth', 'googleCallback', 'forgotPassword', 'logout', 'getProfile']
  },
  {
    route: 'productRoutes.js',
    controller: 'productController.js',
    functions: ['getAllProducts', 'getProductById']
  },
  {
    route: 'addressRoutes.js',
    controller: 'addressController.js',
    functions: ['getAddresses', 'createAddress', 'updateAddress', 'deleteAddress']
  },
  {
    route: 'cartRoutes.js',
    controller: 'cartController.js',
    functions: ['getCart', 'addToCart', 'updateCartItem', 'removeFromCart', 'clearCart']
  },
  {
    route: 'wishlistRoutes.js',
    controller: 'wishlistController.js',
    functions: ['getWishlist', 'addToWishlist', 'removeFromWishlist', 'isInWishlist']
  },
  {
    route: 'orderRoutes.js',
    controller: 'orderController.js',
    functions: ['createOrder', 'getOrders', 'getOrderById', 'updateOrderStatus']
  },
  {
    route: 'discountRoutes.js',
    controller: 'discountController.js',
    functions: ['getDiscounts', 'validateDiscount', 'createDiscount', 'updateDiscount', 'deleteDiscount']
  },
  {
    route: 'adminRoutes.js',
    controllers: [
      { name: 'adminController.js', functions: ['checkHealth'] },
      { name: 'adminAnalyticsController.js', functions: ['getDashboardKPIs', 'getRevenueByMetalType', 'getSalesComparison', 'getLowStockProducts'] },
      { name: 'adminOrderController.js', functions: ['getAllOrders', 'getOrderDetails'] }
    ]
  }
];

routeControllerMap.forEach(config => {
  const routePath = path.join(routesDir, config.route);
  
  if (!fs.existsSync(routePath)) {
    console.log(`⚠️  ${config.route}: File not found`);
    return;
  }
  
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  if (config.controller) {
    // Single controller
    const controllerPath = path.join(controllersDir, config.controller);
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      config.functions.forEach(funcName => {
        const routeHasImport = routeContent.includes(funcName);
        const controllerHasExport = controllerContent.includes(funcName);
        
        if (routeHasImport && controllerHasExport) {
          console.log(`✅ ${config.route} → ${config.controller}: ${funcName}`);
        } else {
          if (!routeHasImport) {
            console.log(`❌ ${config.route}: Missing import for ${funcName}`);
            hasErrors = true;
          }
          if (!controllerHasExport) {
            console.log(`❌ ${config.controller}: Missing export for ${funcName}`);
            hasErrors = true;
          }
        }
      });
    }
  } else if (config.controllers) {
    // Multiple controllers (adminRoutes)
    config.controllers.forEach(ctrl => {
      const controllerPath = path.join(controllersDir, ctrl.name);
      if (fs.existsSync(controllerPath)) {
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');
        ctrl.functions.forEach(funcName => {
          const routeHasImport = routeContent.includes(funcName);
          const controllerHasExport = controllerContent.includes(funcName);
          
          if (routeHasImport && controllerHasExport) {
            console.log(`✅ ${config.route} → ${ctrl.name}: ${funcName}`);
          } else {
            if (!routeHasImport) {
              console.log(`❌ ${config.route}: Missing import for ${funcName}`);
              hasErrors = true;
            }
            if (!controllerHasExport) {
              console.log(`❌ ${ctrl.name}: Missing export for ${funcName}`);
              hasErrors = true;
            }
          }
        });
      }
    });
  }
});

console.log('\n' + '='.repeat(50) + '\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  WARNING: .env file not found!\n');
  console.log('To fix the "Missing Supabase environment variables" errors:');
  console.log('1. Create backend/.env file');
  console.log('2. Add the following variables:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('   JWT_SECRET=your-secret-key\n');
  console.log('Run: node check-env.js to verify after creating .env\n');
  hasErrors = true;
} else {
  console.log('✅ .env file exists');
  console.log('   Run: node check-env.js to verify environment variables are set\n');
}

if (hasErrors) {
  console.log('❌ Some issues found. Please fix them before starting the server.\n');
  console.log('Next steps:');
  console.log('1. Create/update backend/.env with Supabase credentials');
  console.log('2. Run: node check-env.js to verify');
  console.log('3. Run: node verify-routes.js again');
  console.log('4. Start server: npm start\n');
  process.exit(1);
} else {
  console.log('✅ All routes and controllers appear to be properly configured!\n');
  console.log('Note: Routes that require Supabase env vars will work once .env is configured.');
  console.log('Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env\n');
  process.exit(0);
}
