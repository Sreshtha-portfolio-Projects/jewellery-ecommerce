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

## Backup Strategy

### Database Backups

#### Supabase Automatic Backups

Supabase provides:
- **Daily Backups**: Automatic daily backups
- **Point-in-Time Recovery**: Restore to any point in time
- **Backup Retention**: Configurable retention period

#### Manual Backup Strategy

For additional safety:

1. **Regular Exports**: Export critical data regularly
2. **Migration Files**: Keep all migration files in version control
3. **Data Exports**: Export product catalog, settings periodically

### Backup Checklist

- [ ] Verify Supabase backups are enabled
- [ ] Test backup restoration process
- [ ] Document restoration procedures
- [ ] Set up backup monitoring alerts
- [ ] Regular backup verification

### Data Recovery Procedures

#### Full Database Recovery

1. Access Supabase dashboard
2. Navigate to Database → Backups
3. Select backup point
4. Restore database
5. Verify data integrity

#### Partial Data Recovery

1. Identify affected tables
2. Export data from backup
3. Import data to production
4. Verify data consistency

### Disaster Recovery Plan

1. **Identify Critical Data**: Orders, customers, products, settings
2. **Backup Frequency**: Daily for critical data
3. **Recovery Time Objective (RTO)**: Target recovery time
4. **Recovery Point Objective (RPO)**: Acceptable data loss window
5. **Testing**: Regular disaster recovery drills

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

