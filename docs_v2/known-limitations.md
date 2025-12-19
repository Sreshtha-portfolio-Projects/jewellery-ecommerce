# Known Limitations

This document explicitly lists features and functionality that are **not yet implemented** to avoid ambiguity for future contributors.

## Payment & Financial

### Automated Refunds
- **Status**: Not implemented
- **Current State**: Refunds are processed manually by admin
- **Future**: Gateway integration for automated refunds (Razorpay refund API)

### Partial Refunds
- **Status**: Not implemented
- **Current State**: Only full order refunds supported
- **Future**: Support for partial refunds per order item

### Multiple Payment Methods
- **Status**: Only Razorpay implemented
- **Current State**: Single payment gateway (Razorpay)
- **Future**: Support for additional payment gateways

### Payment Retry Logic
- **Status**: Not implemented
- **Current State**: Failed payments require new order intent
- **Future**: Automatic retry for failed payments

## Shipping & Fulfillment

### Courier API Integration
- **Status**: Not implemented
- **Current State**: Manual shipment creation, tracking IDs entered manually
- **Future**: Integration with courier APIs (Shiprocket, Delhivery, Blue Dart) for automatic shipment creation and tracking

### Real-Time Tracking
- **Status**: Not implemented
- **Current State**: Tracking IDs stored but not fetched from courier
- **Future**: Real-time tracking updates from courier APIs

### Multiple Shipping Addresses per Order
- **Status**: Not implemented
- **Current State**: Single shipping address per order
- **Future**: Support for split shipments to multiple addresses

### Shipping Label Generation
- **Status**: Not implemented
- **Current State**: Manual shipping label creation
- **Future**: Automatic shipping label generation via courier APIs

## Notifications & Communication

### Email Notifications
- **Status**: Not implemented
- **Current State**: No automated email notifications
- **Future**: Email notifications for:
  - Order confirmation
  - Shipping updates
  - Delivery confirmation
  - Return status updates
  - Payment receipts

### SMS Notifications
- **Status**: Not implemented
- **Current State**: No SMS notifications
- **Future**: SMS notifications for critical order updates

### Push Notifications
- **Status**: Not implemented
- **Current State**: No push notifications
- **Future**: Browser push notifications for order updates

### WhatsApp Notifications
- **Status**: Not implemented
- **Current State**: No WhatsApp integration
- **Future**: WhatsApp notifications via Twilio or similar service

## Customer Features

### Product Reviews & Ratings
- **Status**: Database schema exists, UI not fully implemented
- **Current State**: Reviews table exists, but review submission and display not complete
- **Future**: Complete review system with ratings, photos, moderation

### Wishlist Sharing
- **Status**: Not implemented
- **Current State**: Private wishlists only
- **Future**: Share wishlist via link, social media

### Gift Wrapping
- **Status**: Not implemented
- **Current State**: No gift wrapping option
- **Future**: Gift wrapping option with message

### Product Recommendations
- **Status**: Not implemented
- **Current State**: No recommendation engine
- **Future**: Personalized product recommendations based on browsing history

### Advanced Search
- **Status**: Basic search implemented
- **Current State**: Simple text search
- **Future**: Advanced filters (price range, metal type, category combinations)

## Admin Features

### Bulk Order Operations
- **Status**: Not implemented
- **Current State**: Orders processed individually
- **Future**: Bulk status updates, bulk shipment creation

### Advanced Analytics
- **Status**: Basic analytics implemented
- **Current State**: Revenue, orders, basic metrics
- **Future**: Advanced analytics:
  - Customer lifetime value
  - Product performance analysis
  - Conversion funnel analysis
  - A/B testing support

### Inventory Forecasting
- **Status**: Not implemented
- **Current State**: Manual inventory management
- **Future**: Automated inventory forecasting and reorder points

### Automated Abandoned Cart Recovery
- **Status**: Tracking implemented, recovery not automated
- **Current State**: Abandoned carts tracked, but no automated recovery campaigns
- **Future**: Automated email campaigns for abandoned carts

### Multi-Admin Roles
- **Status**: Basic admin role only
- **Current State**: Single admin role
- **Future**: Role-based permissions (inventory manager, order manager, etc.)

## Technical Features

### Real-Time Updates
- **Status**: Not implemented
- **Current State**: Polling or page refresh required
- **Future**: WebSocket or Server-Sent Events for real-time order status updates

### API Rate Limiting
- **Status**: Basic rate limiting on auth routes only
- **Current State**: Limited rate limiting
- **Future**: Comprehensive rate limiting with different limits per endpoint

### Caching Layer
- **Status**: Config caching only
- **Current State**: Minimal caching
- **Future**: Redis caching for products, frequently accessed data

### Image Optimization
- **Status**: Basic image storage
- **Current State**: Images stored as uploaded
- **Future**: Automatic image optimization, multiple sizes, WebP conversion

### CDN Integration
- **Status**: Supabase CDN used, not explicitly configured
- **Current State**: Supabase provides CDN automatically
- **Future**: Explicit CDN configuration for custom domains

## Internationalization

### Multi-Language Support
- **Status**: Not implemented
- **Current State**: English only
- **Future**: Support for multiple languages

### Multi-Currency Support
- **Status**: Not implemented
- **Current State**: INR only
- **Future**: Support for multiple currencies with conversion

### Regional Tax Rules
- **Status**: Single tax rate
- **Current State**: Single GST percentage
- **Future**: Region-specific tax rules, multiple tax types

## Security & Compliance

### Two-Factor Authentication
- **Status**: Not implemented
- **Current State**: Password-only authentication
- **Future**: 2FA for admin accounts

### PCI DSS Compliance
- **Status**: Payment data handled by Razorpay (PCI compliant)
- **Current State**: No card data stored, Razorpay handles compliance
- **Future**: Additional compliance features if needed

### GDPR Compliance Features
- **Status**: Not implemented
- **Current State**: No explicit GDPR features
- **Future**: Data export, data deletion, consent management

## Performance & Scalability

### Database Read Replicas
- **Status**: Not implemented
- **Current State**: Single database instance
- **Future**: Read replicas for scaling reads

### Microservices Architecture
- **Status**: Monolithic architecture
- **Current State**: Single backend service
- **Future**: Microservices separation for independent scaling

### Event-Driven Architecture
- **Status**: Synchronous processing
- **Current State**: Request-response pattern
- **Future**: Event-driven architecture for async operations

### Horizontal Scaling
- **Status**: Single instance
- **Current State**: Single backend instance
- **Future**: Load balancing, multiple instances

## Testing & Quality

### Automated Testing
- **Status**: Manual testing only
- **Current State**: 211 manual test cases
- **Future**: Automated unit tests, integration tests, E2E tests

### Performance Testing
- **Status**: Not implemented
- **Current State**: No performance benchmarks
- **Future**: Load testing, stress testing, performance benchmarks

### Accessibility Testing
- **Status**: Not implemented
- **Current State**: Basic accessibility
- **Future**: WCAG compliance, screen reader testing

## Documentation

### API Documentation
- **Status**: Swagger UI available
- **Current State**: Basic API documentation
- **Future**: Comprehensive API documentation with examples

### Developer Documentation
- **Status**: Basic documentation
- **Current State**: This documentation set
- **Future**: Additional developer guides, code examples

## Third-Party Integrations

### Social Media Login
- **Status**: Google OAuth implemented, others not
- **Current State**: Google OAuth only
- **Future**: Facebook, Apple, other OAuth providers

### Social Media Sharing
- **Status**: Not implemented
- **Current State**: No social sharing
- **Future**: Share products, orders on social media

### Marketing Integrations
- **Status**: Not implemented
- **Current State**: No marketing tool integrations
- **Future**: Google Analytics, Facebook Pixel, marketing automation

## Mobile

### Mobile App
- **Status**: Not implemented
- **Current State**: Web application only (responsive)
- **Future**: Native mobile apps (iOS, Android)

### Progressive Web App (PWA)
- **Status**: Not implemented
- **Current State**: Standard web application
- **Future**: PWA features (offline support, app-like experience)

## Reporting

### Custom Reports
- **Status**: Not implemented
- **Current State**: Fixed analytics dashboards
- **Future**: Custom report builder, scheduled reports

### Export Functionality
- **Status**: Basic exports (products, orders)
- **Current State**: CSV exports available
- **Future**: PDF reports, Excel exports, custom formats

## Workflow Automation

### Automated Workflows
- **Status**: Not implemented
- **Current State**: Manual processes
- **Future**: Workflow automation for common tasks

### Scheduled Tasks
- **Status**: Manual triggers only
- **Current State**: Background jobs triggered manually
- **Future**: Scheduled tasks (inventory expiry, abandoned cart marking)

## Important Notes

### What This Means

This list represents features that are **planned but not yet implemented**. The current system is **production-ready** for the implemented features, but these limitations should be considered when:

- Planning new features
- Setting user expectations
- Making architectural decisions
- Prioritizing development work

### Contributing

When implementing any of these features:

1. Update this document to mark feature as implemented
2. Add implementation details to relevant documentation
3. Add test cases to testing guide
4. Update architecture documentation if needed

### Priority Guidance

Features are listed without priority. Priority should be determined based on:
- Business requirements
- User feedback
- Technical dependencies
- Resource availability

