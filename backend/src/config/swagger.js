const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aldorado Jewells E-commerce API',
      version: '1.0.0',
      description: 'Complete API documentation for Aldorado Jewells luxury jewellery e-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@aldoradojewells.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.aldoradojewells.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoints'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            short_description: { type: 'string' },
            category: { type: 'string', enum: ['rings', 'earrings', 'necklaces', 'bracelets'] },
            metal_type: { type: 'string' },
            purity: { type: 'string' },
            karat: { type: 'integer' },
            base_price: { type: 'number', format: 'decimal' },
            price: { type: 'number', format: 'decimal' },
            image_url: { type: 'string', format: 'uri' },
            is_active: { type: 'boolean' },
            is_bestseller: { type: 'boolean' },
            stock_quantity: { type: 'integer' },
            sku: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string', format: 'uuid' },
            size: { type: 'string' },
            color: { type: 'string' },
            finish: { type: 'string' },
            weight: { type: 'number', format: 'decimal' },
            stock_quantity: { type: 'integer' },
            sku: { type: 'string' },
            price_override: { type: 'number', format: 'decimal', nullable: true },
            is_active: { type: 'boolean' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            order_number: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            total_amount: { type: 'number', format: 'decimal' },
            status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'delivered', 'returned'] },
            payment_status: { type: 'string' },
            shipping_address_id: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            product: { $ref: '#/components/schemas/Product' }
          }
        },
        Address: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            full_name: { type: 'string' },
            phone: { type: 'string' },
            address_line1: { type: 'string' },
            address_line2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postal_code: { type: 'string' },
            country: { type: 'string' },
            is_default: { type: 'boolean' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            review_text: { type: 'string' },
            is_verified_purchase: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        OrderIntent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            intent_number: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['DRAFT', 'INTENT_CREATED', 'EXPIRED', 'CONVERTED', 'CANCELLED'] 
            },
            cart_snapshot: { type: 'object' },
            subtotal: { type: 'number', format: 'decimal' },
            discount_amount: { type: 'number', format: 'decimal' },
            tax_amount: { type: 'number', format: 'decimal' },
            shipping_charge: { type: 'number', format: 'decimal' },
            total_amount: { type: 'number', format: 'decimal' },
            discount_code: { type: 'string', nullable: true },
            shipping_address_id: { type: 'string', format: 'uuid' },
            billing_address_id: { type: 'string', format: 'uuid' },
            expires_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        InventoryLock: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            order_intent_id: { type: 'string', format: 'uuid' },
            variant_id: { type: 'string', format: 'uuid' },
            quantity_locked: { type: 'integer' },
            locked_at: { type: 'string', format: 'date-time' },
            expires_at: { type: 'string', format: 'date-time' },
            released_at: { type: 'string', format: 'date-time', nullable: true },
            status: { 
              type: 'string', 
              enum: ['LOCKED', 'RELEASED', 'CONVERTED', 'EXPIRED'] 
            }
          }
        },
        AdminSetting: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            setting_key: { type: 'string' },
            setting_value: { type: 'string' },
            setting_type: { 
              type: 'string', 
              enum: ['string', 'number', 'boolean', 'json'] 
            },
            category: { 
              type: 'string', 
              enum: ['pricing', 'tax', 'shipping', 'inventory', 'checkout', 'general'] 
            },
            description: { type: 'string', nullable: true },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        AbandonedCart: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid', nullable: true },
            session_id: { type: 'string', nullable: true },
            cart_value: { type: 'number', format: 'decimal' },
            item_count: { type: 'integer' },
            last_activity_at: { type: 'string', format: 'date-time' },
            abandoned_at: { type: 'string', format: 'date-time', nullable: true },
            recovered_at: { type: 'string', format: 'date-time', nullable: true },
            status: { 
              type: 'string', 
              enum: ['ACTIVE', 'ABANDONED', 'RECOVERED', 'EXPIRED'] 
            },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        InventorySummary: {
          type: 'object',
          properties: {
            total_stock: { type: 'integer' },
            locked_stock: { type: 'integer' },
            available_stock: { type: 'integer' },
            low_stock_variants: { 
              type: 'array',
              items: { $ref: '#/components/schemas/ProductVariant' }
            },
            active_locks: { type: 'integer' }
          }
        },
        AbandonedCartStats: {
          type: 'object',
          properties: {
            total_abandoned: { type: 'integer' },
            total_active: { type: 'integer' },
            abandoned_value: { type: 'number', format: 'decimal' },
            active_value: { type: 'number', format: 'decimal' },
            abandonment_rate: { type: 'number', format: 'float' },
            timeout_minutes: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'General', description: 'General API endpoints' },
      { name: 'Authentication', description: 'Admin and customer authentication endpoints' },
      { name: 'Products', description: 'Public product endpoints' },
      { name: 'Admin Products', description: 'Admin product management endpoints' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order management and order intents' },
      { name: 'Order Intents', description: 'Order intent system (pre-payment)' },
      { name: 'Addresses', description: 'User address management' },
      { name: 'Wishlist', description: 'Wishlist operations' },
      { name: 'Discounts', description: 'Discount/coupon management' },
      { name: 'Reviews', description: 'Product reviews and ratings' },
      { name: 'Delivery', description: 'Delivery and shipping information' },
      { name: 'Shipments', description: 'Shipment and tracking management' },
      { name: 'Admin', description: 'Admin dashboard, analytics, and settings' },
      { name: 'Admin Settings', description: 'Admin configuration management' },
      { name: 'Admin Inventory', description: 'Inventory lock management' },
      { name: 'Abandoned Carts', description: 'Abandoned cart tracking and management' },
      { name: 'Pricing Rules', description: 'Dynamic pricing rules management' }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js'] // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

