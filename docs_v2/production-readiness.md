# Production Readiness

This document covers health checks, error handling, audit logging, configuration management, and backup strategy for production deployment.

## Health Checks

### Backend Health Check

Endpoint: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-01-19T12:00:00.000Z"
}
```

**Use Cases**:
- Load balancer health checks
- Monitoring system checks
- Deployment verification

### Database Connectivity Check

The health check endpoint verifies:
- Database connection is active
- Supabase client is initialized
- Service role key is valid

If database is unreachable, health check returns 503 status.

### External Service Status

Monitor external service dependencies:
- Supabase: Database and storage availability
- Razorpay: Payment gateway availability
- Email service: If configured

## Error Handling

### Error Response Format

All API errors follow consistent format:

```json
{
  "error": true,
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Error Categories

#### Client Errors (4xx)

- **400 Bad Request**: Invalid input, validation failed
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate entry)

#### Server Errors (5xx)

- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: External service unavailable

### Error Logging

**Development**:
- Full error stack traces logged to console
- Error details included in response

**Production**:
- Errors logged to console (structured format)
- Stack traces hidden from client responses
- Error context included for debugging (without sensitive data)

### Error Handling Best Practices

1. **Validate Input Early**: Validate all inputs before processing
2. **Handle Database Errors**: Catch and handle database errors gracefully
3. **Log Errors**: Log all errors with context for debugging
4. **User-Friendly Messages**: Return user-friendly error messages
5. **Don't Expose Internals**: Never expose internal errors to clients
6. **Graceful Degradation**: Handle external service failures gracefully

### Common Error Scenarios

#### Authentication Errors

- **Missing Token**: Return 401 with message "Authentication required"
- **Invalid Token**: Return 403 with message "Invalid or expired token"
- **Expired Token**: Return 403 with message "Token expired, please login again"

#### Validation Errors

- **Invalid Input**: Return 400 with specific field errors
- **Missing Required Field**: Return 400 with field name
- **Invalid Format**: Return 400 with format requirements

#### State Machine Errors

- **Invalid Transition**: Return 400 with valid next statuses
- **State Conflict**: Return 409 with current state information

#### Payment Errors

- **Payment Failed**: Return 400 with payment failure reason
- **Webhook Verification Failed**: Return 400, log security warning
- **Amount Mismatch**: Log warning, process if within tolerance

## Audit Logging

### Audit Log Structure

All audit logs stored in `audit_logs` table:

- `id`: Unique log ID
- `user_id`: User who performed action (null for system)
- `action`: Action type (e.g., 'order_status_changed')
- `entity_type`: Entity type (e.g., 'order', 'return_request')
- `entity_id`: Entity ID (UUID)
- `old_values`: Previous state (JSONB)
- `new_values`: New state (JSONB)
- `ip_address`: IP address of requester
- `user_agent`: User agent string
- `created_at`: Timestamp (immutable)

### Logged Actions

#### Order Actions
- `order_created`: When order is created
- `order_status_changed`: When order status changes

#### Shipping Actions
- `shipping_status_changed`: When shipping status updates

#### Return Actions
- `return_status_changed`: All return status transitions
  - REQUESTED (from NONE)
  - APPROVED (from REQUESTED)
  - REJECTED (from REQUESTED)
  - RECEIVED (from APPROVED)
  - REFUND_INITIATED (from RECEIVED)
  - REFUNDED (from REFUND_INITIATED)

#### Admin Actions
- `admin_login_success`: Successful admin login
- `admin_login_failed`: Failed login attempt

### Audit Log Immutability

Audit logs are immutable:

- **RLS Policy**: Blocks all direct database access
- **No Updates**: Updates not allowed
- **No Deletes**: Deletes not allowed
- **Read-Only**: Logs are read-only for all users
- **Service Role Only**: Only backend service role can insert logs

### Audit Log Access

Admin can view audit logs via:

- `GET /api/admin/audit-logs`: List all audit logs with filters
- `GET /api/admin/audit-logs/:id`: Get specific audit log
- `GET /api/admin/audit-logs/entity/:entityType/:entityId`: Get logs for specific entity
- `GET /api/admin/audit-logs/stats`: Get audit statistics

**Filtering Options**:
- Entity type
- Entity ID
- Action type
- User (admin)
- Date range
- Pagination support

### Audit Log Best Practices

1. **Log All Critical Actions**: Order changes, status updates, admin actions
2. **Include Context**: Old and new values, user information
3. **Never Modify Logs**: Logs are immutable for compliance
4. **Regular Review**: Review audit logs regularly for security
5. **Retention Policy**: Define retention policy for audit logs

## Configuration Management

### Admin Settings

All configurable business rules stored in `admin_settings` table:

- **Tax Percentage**: GST percentage (default: 18%)
- **Shipping Charge**: Base shipping charge (default: 0)
- **Free Shipping Threshold**: Order value for free shipping (default: 5000)
- **Return Window Days**: Days allowed for returns (default: 7)
- **Delivery Days**: Min/max delivery days (default: 3-5)
- **Inventory Lock Duration**: Minutes to lock inventory (default: 30)
- **State Machine Configs**: Order, shipping, return transitions

### Config Service

Centralized `configService.js` provides:

- **Cached Access**: Settings cached for 1 minute (TTL)
- **Type-Safe Getters**: Methods for different setting types
- **State Machine Validation**: Methods for state transitions
- **Automatic Cache Invalidation**: Cache cleared on settings update

### Configuration Updates

Admin can update settings via:

- **Admin Panel**: Settings page with organized categories
- **API**: `PUT /api/admin/settings/:key` for programmatic updates

**Cache Management**:
- Settings updates automatically clear config cache
- Changes take effect immediately
- No server restart required

### Environment Variables

#### Backend Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret)
- `JWT_SECRET`: JWT signing secret (min 32 characters)
- `RAZORPAY_KEY_ID`: Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Razorpay secret key
- `RAZORPAY_WEBHOOK_SECRET`: Webhook verification secret

Optional:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ADMIN_EMAILS`: Comma-separated admin emails (legacy)
- `FRONTEND_URL`: Frontend URL for CORS

#### Frontend Environment Variables

Required:
- `VITE_API_BASE_URL`: Backend API URL

### Configuration Security

1. **Never Commit Secrets**: All secrets in environment variables
2. **Use Strong Secrets**: Generate strong random secrets for production
3. **Rotate Secrets**: Rotate secrets regularly
4. **Separate Environments**: Use different secrets for dev/staging/production
5. **Service Role Key**: Never expose service role key to frontend

## Backup & Recovery Strategy

### 1️⃣ Critical Data Identification

#### Database Tables (Priority Order)

**Tier 1 - Business Critical (Cannot Lose)**:
- `orders` - All customer orders with financial data
- `order_items` - Order line items with price snapshots (immutable)
- `payment_transactions` - Payment references and Razorpay IDs
- `return_requests` - Return and refund records
- `audit_logs` - Immutable audit trail (compliance requirement)

**Tier 2 - Operational Critical (High Impact)**:
- `auth.users` - User accounts and authentication data
- `addresses` - Customer shipping/billing addresses
- `products` - Product catalog
- `product_variants` - Variant pricing and stock levels
- `admin_settings` - System configuration (tax, shipping, state machines)
- `order_intents` - Pre-payment order intents
- `inventory_locks` - Active inventory reservations

**Tier 3 - Supporting Data (Can Rebuild)**:
- `carts` - Shopping cart items (can be rebuilt)
- `wishlists` - User wishlists
- `discounts` - Coupon codes
- `product_images` - Image metadata (files in storage)
- `reviews` - Product reviews
- `order_status_history` - Status change history
- `shipping_status_history` - Shipping status history
- `return_request_history` - Return status history

#### File Storage (Supabase Storage)

**Critical Buckets**:
- `invoices` - PDF invoices (one per paid order)
- `product-images` - Product and variant images

**Storage Structure**:
```
invoices/
  └── {order_id}/
      └── INV-{order_number}.pdf

product-images/
  └── {product_id}/
      └── {timestamp}-{random}.{ext}
```

### 2️⃣ Database Backup Plan

#### Supabase Automatic Backups

**What Supabase Provides**:
- ✅ **Daily Backups**: Automatic daily backups (included in all plans)
- ✅ **Point-in-Time Recovery (PITR)**: Restore to any point in time (Pro plan+)
- ✅ **Backup Retention**: 
  - Free/Tier: 7 days retention
  - Pro: 7 days retention
  - Team/Enterprise: Custom retention (up to 30+ days)

**How to Verify Backups**:
1. Go to Supabase Dashboard → Project Settings → Database
2. Check "Backups" section
3. Verify last backup timestamp
4. Check backup retention period

**Backup Location**: Managed by Supabase (encrypted, geo-redundant)

#### Manual Backup Strategy

**When to Use Manual Backups**:
- Before major migrations
- Before bulk data changes
- Weekly/monthly archival
- Before system updates

**Manual Export Process**:

**Option 1: Supabase Dashboard Export** (Recommended for small datasets):
1. Go to Supabase Dashboard → Table Editor
2. Select table → Click "..." → "Export as CSV"
3. Save CSV file locally
4. Repeat for all critical tables

**Option 2: SQL Export via Supabase SQL Editor**:
```sql
-- Export orders (last 30 days)
COPY (
  SELECT * FROM orders 
  WHERE created_at >= NOW() - INTERVAL '30 days'
) TO STDOUT WITH CSV HEADER;

-- Export all critical tables
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM order_items) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM payment_transactions) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM return_requests) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM audit_logs) TO STDOUT WITH CSV HEADER;
```

**Option 3: pg_dump (Full Database)**:
```bash
# Using Supabase connection string
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --format=custom \
  --file=aldorado_backup_$(date +%Y%m%d).dump

# Restore
pg_restore -d "postgresql://..." aldorado_backup_20250119.dump
```

**Backup Frequency Recommendations**:
- **Daily**: Automatic (Supabase handles this)
- **Weekly**: Manual export of critical tables (orders, payments)
- **Monthly**: Full database export for archival
- **Before Major Changes**: Always backup before migrations/bulk updates

**Backup Storage**:
- Store manual backups in secure cloud storage (encrypted)
- Keep at least 3 months of weekly backups
- Keep at least 1 year of monthly backups
- Never store backups in same location as production

### 3️⃣ File & Asset Safety

#### Invoice PDFs

**Storage Location**: Supabase Storage bucket `invoices`

**Structure**: `invoices/{order_id}/INV-{order_number}.pdf`

**Backup Strategy**:
- ✅ **Automatic**: Supabase Storage is automatically backed up
- ✅ **Manual**: Download invoices periodically for archival
- ✅ **Verification**: Check invoice URLs are accessible

**Recovery Process**:
1. Invoices are regenerated on-demand if missing
2. Invoice service checks `order.invoice_url` before generating
3. If URL exists, returns existing invoice
4. If missing, regenerates from order data

**Verification Query**:
```sql
-- Check orders with missing invoices
SELECT id, order_number, payment_status, invoice_url
FROM orders
WHERE payment_status = 'paid' 
  AND (invoice_url IS NULL OR invoice_url = '');
```

#### Product Images

**Storage Location**: Supabase Storage bucket `product-images`

**Structure**: `product-images/{product_id}/{timestamp}-{random}.{ext}`

**Backup Strategy**:
- ✅ **Automatic**: Supabase Storage is automatically backed up
- ✅ **Manual**: Export image URLs and metadata
- ✅ **Verification**: Check for orphaned images (no product reference)

**Orphaned File Detection**:
```sql
-- Find product_images without corresponding products
SELECT pi.id, pi.product_id, pi.image_url
FROM product_images pi
LEFT JOIN products p ON pi.product_id = p.id
WHERE p.id IS NULL;

-- Find images in storage without database records
-- (Requires listing storage bucket and comparing)
```

**Recovery Process**:
1. Images are referenced in `product_images` table
2. If image missing from storage, admin can re-upload
3. Image URLs are stored in database (can rebuild from URLs if needed)

### 4️⃣ Recovery Playbook

#### Scenario 1: Database Corruption or Data Loss

**Symptoms**:
- Database queries fail
- Data appears missing
- Application errors

**Recovery Steps**:

1. **Assess Damage**:
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM order_items;
   SELECT COUNT(*) FROM payment_transactions;
   SELECT COUNT(*) FROM audit_logs;
   ```

2. **Stop Application** (if possible):
   - Pause backend deployment (Render/Vercel)
   - Prevent new orders/payments

3. **Restore from Supabase Backup**:
   - Go to Supabase Dashboard → Database → Backups
   - Select backup point (before corruption)
   - Click "Restore" (creates new database)
   - Update connection string if needed

4. **Verify Data Integrity**:
   ```sql
   -- Verify critical data exists
   SELECT COUNT(*) FROM orders WHERE created_at >= '2025-01-01';
   SELECT COUNT(*) FROM payment_transactions;
   ```

5. **Resume Application**:
   - Update environment variables if database changed
   - Restart backend
   - Test critical flows (login, order view)

**Time Estimate**: 15-30 minutes

#### Scenario 2: Backend Redeployment (Data Intact)

**Symptoms**:
- Backend not responding
- Need to redeploy code

**Recovery Steps**:

1. **Verify Database is Healthy**:
   ```sql
   SELECT COUNT(*) FROM orders;
   -- Should return count, not error
   ```

2. **Check Environment Variables**:
   - Verify all env vars are set in deployment platform
   - Check `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Check `JWT_SECRET`, `RAZORPAY_*` keys

3. **Redeploy Backend**:
   - Push code to repository
   - Trigger deployment (Render auto-deploys on push)
   - Or manually redeploy from dashboard

4. **Verify Health**:
   ```bash
   curl https://your-backend.herokuapp.com/api/health
   # Should return: {"status":"ok","api":"up","database":"up",...}
   ```

5. **Test Critical Endpoints**:
   - `GET /api/health` - Health check
   - `GET /api/products` - Product listing
   - `POST /api/auth/login` - Authentication

**Time Estimate**: 5-10 minutes

#### Scenario 3: Frontend Redeployment (Data Intact)

**Symptoms**:
- Frontend not loading
- Need to redeploy frontend

**Recovery Steps**:

1. **Verify Backend is Healthy**:
   ```bash
   curl https://your-backend.herokuapp.com/api/health
   ```

2. **Check Environment Variables**:
   - Verify `VITE_API_BASE_URL` is set correctly
   - Should point to backend URL

3. **Redeploy Frontend**:
   - Push code to repository
   - Vercel auto-deploys on push
   - Or manually redeploy from Vercel dashboard

4. **Verify Frontend Loads**:
   - Open frontend URL in browser
   - Check browser console for errors
   - Test login flow

**Time Estimate**: 3-5 minutes

#### Scenario 4: Partial Data Loss (Single Table)

**Symptoms**:
- Specific table data missing
- Other tables intact

**Recovery Steps**:

1. **Identify Affected Table**:
   ```sql
   -- Example: orders table
   SELECT COUNT(*) FROM orders;
   -- If count is 0 or lower than expected
   ```

2. **Export from Backup**:
   - Use Supabase Point-in-Time Recovery
   - Or restore from manual backup CSV

3. **Restore Data**:
   ```sql
   -- Option 1: Import CSV via Supabase Dashboard
   -- Table Editor → Import CSV
   
   -- Option 2: SQL INSERT (from backup)
   INSERT INTO orders (id, order_number, user_id, ...)
   SELECT id, order_number, user_id, ...
   FROM backup_orders;
   ```

4. **Verify Relationships**:
   ```sql
   -- Check foreign keys are valid
   SELECT o.id, o.user_id, u.id as user_exists
   FROM orders o
   LEFT JOIN auth.users u ON o.user_id = u.id
   WHERE u.id IS NULL;
   ```

5. **Test Application**:
   - Verify affected functionality works
   - Check related data (e.g., order_items for orders)

**Time Estimate**: 10-20 minutes (depending on data volume)

#### Scenario 5: Storage Bucket Loss (Images/Invoices)

**Symptoms**:
- Images not loading
- Invoice PDFs missing

**Recovery Steps**:

1. **Verify Storage Bucket**:
   - Go to Supabase Dashboard → Storage
   - Check if bucket exists
   - Check file count

2. **For Product Images**:
   - Check `product_images` table for URLs
   - If URLs exist but files missing, re-upload images
   - Admin can bulk re-upload via admin panel

3. **For Invoices**:
   - Invoices are regenerated on-demand
   - Check `orders.invoice_url` for existing invoices
   - Missing invoices will be regenerated when accessed:
     ```
     GET /api/orders/:orderId/invoice
     ```

4. **Prevent Future Loss**:
   - Verify Supabase Storage backups are enabled
   - Consider periodic export of critical files

**Time Estimate**: 30-60 minutes (if manual re-upload needed)

#### Scenario 6: Complete System Failure

**Symptoms**:
- Database unreachable
- Backend down
- Frontend down

**Recovery Steps**:

1. **Assess Situation**:
   - Check Supabase status page
   - Check deployment platform status (Render/Vercel)
   - Check DNS/domain status

2. **Restore Database First**:
   - Use Supabase backup restore
   - Or restore from manual backup

3. **Restore Backend**:
   - Redeploy backend code
   - Verify environment variables
   - Test health endpoint

4. **Restore Frontend**:
   - Redeploy frontend code
   - Verify environment variables
   - Test frontend loads

5. **Verify End-to-End**:
   - Test login
   - Test product listing
   - Test order creation (test mode)
   - Check critical data exists

**Time Estimate**: 30-60 minutes

### 5️⃣ Backup Verification

#### Weekly Verification Checklist

- [ ] Verify Supabase automatic backups are running
- [ ] Check last backup timestamp (should be within 24 hours)
- [ ] Test restore process (on staging/test database)
- [ ] Verify invoice URLs are accessible
- [ ] Check product image URLs are accessible
- [ ] Export critical tables (orders, payments) for archival
- [ ] Verify backup files are stored securely

#### Monthly Verification Checklist

- [ ] Full database export (pg_dump)
- [ ] Verify backup file integrity
- [ ] Test full restore process (on test database)
- [ ] Review backup retention policy
- [ ] Check for orphaned files in storage
- [ ] Verify audit logs are intact
- [ ] Document any issues or improvements

### 6️⃣ Backup Storage Locations

**Recommended Storage**:
- **Primary**: Supabase automatic backups (managed)
- **Secondary**: Manual exports in encrypted cloud storage:
  - Google Drive (encrypted folder)
  - AWS S3 (encrypted bucket)
  - OneDrive (encrypted folder)
  - Local encrypted drive (for small backups)

**Backup File Naming**:
```
aldorado_backup_YYYYMMDD_HHMMSS.dump
aldorado_orders_YYYYMMDD.csv
aldorado_payments_YYYYMMDD.csv
```

### 7️⃣ Recovery Testing

#### Quarterly Disaster Recovery Drill

**Test Scenario**: Simulate database corruption

1. **Create Test Database**:
   - Restore from backup to test database
   - Verify data integrity

2. **Test Recovery Process**:
   - Follow recovery playbook
   - Time the recovery process
   - Document any issues

3. **Verify Data**:
   - Check all critical tables
   - Verify relationships intact
   - Test application functionality

4. **Document Results**:
   - Recovery time
   - Issues encountered
   - Improvements needed

**Target Recovery Time**: < 30 minutes for full database restore

### 8️⃣ Backup Monitoring

#### Alerts to Set Up

- **Backup Failure**: Alert if Supabase backup fails
- **Storage Quota**: Alert if storage bucket near limit
- **Database Size**: Alert if database size growing rapidly
- **Missing Backups**: Alert if no backup in 48 hours

#### Monitoring Tools

- **Supabase Dashboard**: Check backup status weekly
- **Manual Verification**: Weekly export of critical tables
- **Automated Scripts**: (Future) Automated backup verification

### 9️⃣ No Single Point of Failure

**Current Protections**:
- ✅ **Database**: Supabase automatic backups + manual exports
- ✅ **Storage**: Supabase Storage automatic backups
- ✅ **Code**: Version control (Git) with deployment history
- ✅ **Configuration**: Environment variables in deployment platform
- ✅ **Audit Logs**: Immutable, cannot be deleted

**Gaps to Address**:
- ⚠️ **Manual Backup Automation**: Consider automated weekly exports
- ⚠️ **Off-Site Backups**: Store backups in separate cloud provider
- ⚠️ **Backup Testing**: Regular restore testing (quarterly)

### 🔟 Quick Reference

#### Backup Commands

```bash
# Export orders (last 30 days) - via Supabase SQL Editor
COPY (
  SELECT * FROM orders 
  WHERE created_at >= NOW() - INTERVAL '30 days'
) TO STDOUT WITH CSV HEADER;

# Full database backup (requires pg_dump)
pg_dump "postgresql://..." --format=custom --file=backup.dump
```

#### Recovery Contacts

- **Supabase Support**: support@supabase.com
- **Render Support**: support@render.com
- **Vercel Support**: support@vercel.com

#### Critical URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Backend Health**: `https://your-backend.onrender.com/api/health`
- **Frontend**: `https://your-frontend.vercel.app`

---

**Last Updated**: 2025-01-19  
**Next Review**: Quarterly

## Monitoring & Alerts

### Key Metrics to Monitor

#### Application Metrics
- Request rate
- Response times
- Error rates
- API endpoint health

#### Business Metrics
- Order creation rate
- Payment success rate
- Cart abandonment rate
- Inventory levels

#### System Metrics
- Database connection pool
- Memory usage
- CPU usage
- Disk space

### Alerting Strategy

Set up alerts for:

- **Critical Errors**: 5xx errors, payment failures
- **High Error Rate**: Error rate above threshold
- **Service Downtime**: Health check failures
- **Database Issues**: Connection failures, slow queries
- **Payment Issues**: Payment gateway failures

### Monitoring Tools

Recommended tools:
- **Application Monitoring**: Sentry, LogRocket
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, Rollbar
- **Performance Monitoring**: New Relic, Datadog

## Security Considerations

### Production Security Checklist

- [ ] HTTPS enabled for all endpoints
- [ ] Strong JWT secrets (32+ characters, random)
- [ ] Service role key secured (never exposed)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (content escaping)
- [ ] Audit logging enabled
- [ ] Regular security reviews

### Secret Management

1. **Environment Variables**: All secrets in environment variables
2. **Never Commit**: Never commit secrets to version control
3. **Rotation**: Rotate secrets regularly
4. **Access Control**: Limit access to production secrets
5. **Monitoring**: Monitor for secret exposure

### Security Best Practices

1. **Principle of Least Privilege**: Grant minimum required permissions
2. **Defense in Depth**: Multiple layers of security
3. **Regular Updates**: Keep dependencies updated
4. **Security Audits**: Regular security reviews
5. **Incident Response**: Plan for security incidents

## Performance Optimization

### Database Optimization

- **Indexes**: Ensure indexes on frequently queried columns
- **Query Optimization**: Optimize slow queries
- **Connection Pooling**: Use connection pooling
- **Caching**: Cache frequently accessed data

### Application Optimization

- **Code Splitting**: Split frontend code for faster loads
- **Image Optimization**: Optimize product images
- **CDN**: Use CDN for static assets
- **Caching**: Cache static content

### Monitoring Performance

- **Response Times**: Monitor API response times
- **Page Load Times**: Monitor frontend page loads
- **Database Query Times**: Monitor slow queries
- **Error Rates**: Monitor error rates

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (smoke tests minimum)
- [ ] Environment variables configured
- [ ] Database migrations run (all 15+ migration files)
- [ ] Supabase Storage bucket created (`product-images`)
- [ ] Razorpay account configured (test mode first)
- [ ] Razorpay webhook URL configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking set up
- [ ] Swagger documentation accessible

### Deployment

- [ ] Deploy backend first (Render or similar)
- [ ] Set all environment variables in deployment platform
- [ ] Verify backend health check (`/health` endpoint)
- [ ] Verify Swagger UI accessible (`/api-docs`)
- [ ] Deploy frontend (Vercel or similar)
- [ ] Set frontend environment variables
- [ ] Verify frontend loads
- [ ] Test critical paths (login, product listing, cart)
- [ ] Monitor for errors

### Post-Deployment

- [ ] Verify all endpoints working
- [ ] Test payment flow with Razorpay test cards
- [ ] Verify webhook received and processed
- [ ] Test admin login and access
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify backups running
- [ ] Test order creation end-to-end
- [ ] Document any issues

### Razorpay Configuration

For production deployment:

1. **Test Mode First**:
   - Use Razorpay test keys
   - Configure webhook URL to production backend
   - Test complete payment flow
   - Verify webhooks received

2. **Switch to Live Mode** (when ready):
   - Complete Razorpay KYC
   - Get live API keys from Razorpay dashboard
   - Update environment variables with live keys
   - Update webhook secret if changed
   - Test with small real payment
   - Monitor closely for 24-48 hours

See `Documents/RAZORPAY_QUICK_SETUP.md` and `Documents/DEPLOYMENT_GUIDE.md` for detailed instructions.

## Troubleshooting Common Issues

### Backend Issues

**Port already in use**:
- Change `PORT` in `backend/.env` to another port (e.g., 3001)
- Update `VITE_API_BASE_URL` in frontend `.env` accordingly
- Restart backend server

**Supabase connection errors**:
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Ensure you're using **service_role** key, not anon key
- Check Supabase project is active (not paused)
- Verify network connectivity

**JWT errors**:
- Ensure `JWT_SECRET` is set and at least 32 characters
- Restart backend after changing `.env`
- Clear browser localStorage if switching environments
- Verify JWT secret matches between environments

**Routes not working**:
- Run `node verify-routes.js` to check route registration
- Check server console for errors on startup
- Verify all controller files export correctly
- Ensure routes are mounted in `server.js`

### Frontend Issues

**Can't connect to backend**:
- Verify backend is running on correct port
- Check `VITE_API_BASE_URL` in `frontend/.env` matches backend URL
- Check browser console for CORS errors
- Verify backend CORS configuration allows frontend URL
- Clear browser cache

**No products showing**:
- Check backend console for errors
- Verify products exist in Supabase (Table Editor)
- Verify products have `is_active = true`
- Test API directly: `http://localhost:3000/api/products`
- Check browser Network tab for failed requests

**Login fails**:
- Verify user exists in Supabase Authentication → Users
- Check backend console for specific error messages
- Verify email/password are correct
- Ensure user is confirmed (Auto Confirm checked)
- Check JWT secret matches between environments

**Admin panel shows "No products found"**:
- Verify logged in as admin (check localStorage for `adminToken`)
- Verify admin role granted in `user_roles` table
- Clear filters (set to "All Status", "All Categories")
- Check browser console for 401/403 errors
- Verify `ALLOWED_ADMIN_EMAILS` includes your email (if using legacy method)

### Payment Issues

**Payment modal doesn't open**:
- Check browser console for errors
- Verify Razorpay script loaded (check Network tab)
- Verify `RAZORPAY_KEY_ID` is set correctly in backend
- Check frontend can reach backend API

**Webhooks not received**:
- Verify webhook URL in Razorpay dashboard matches backend URL
- Check `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- Check backend logs for webhook requests
- Ensure webhook URL uses `https://` (not `http://`)
- For local testing, ensure ngrok/cloudflared tunnel is active
- Verify webhook events are enabled in Razorpay dashboard

**Payment verification fails**:
- Check signature verification logic
- Verify payment details are correct
- Check backend logs for specific error messages

### Database Issues

**Migrations fail**:
- Run migrations one at a time
- Check for error messages in SQL Editor
- Verify previous migrations completed successfully
- Some migrations depend on previous ones - run in order

**Function does not exist errors**:
- Re-run relevant migration file in Supabase SQL Editor
- Verify function was created successfully
- Check migration file for syntax errors

**RLS blocking queries**:
- Backend uses service_role key, so RLS is bypassed
- If issues persist, check RLS policies in Supabase Dashboard
- Verify service_role key is correct

### Environment-Specific Issues

**403 errors on localhost**:
- Tokens created on production use production JWT_SECRET
- Local backend uses different JWT_SECRET
- Solution: Clear localStorage and login again on localhost
- Or use production backend URL in local frontend `.env`

**Production tokens work but local don't**:
- Local `JWT_SECRET` might be wrong
- Check `backend/.env` matches expected secret
- Regenerate if needed

**Vercel still using localhost API**:
- Check Vercel environment variables are set
- Redeploy after setting environment variables
- Check build logs to verify env vars are loaded

## Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review error logs, check backup status
- **Monthly**: Review audit logs, security review
- **Quarterly**: Performance optimization, dependency updates

### Maintenance Checklist

- [ ] Review and clean error logs
- [ ] Verify backup integrity
- [ ] Review audit logs for anomalies
- [ ] Update dependencies
- [ ] Performance optimization
- [ ] Security updates

