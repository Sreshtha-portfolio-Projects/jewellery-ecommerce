# Admin Operations

This document describes admin responsibilities, order handling, shipping updates, return approvals, and system configuration.

## Admin Access

### Admin Authentication

Admins log in via `/admin/login`:

1. Admin enters email and password
2. Backend verifies credentials with Supabase Auth
3. Backend checks admin status:
   - Email in `ALLOWED_ADMIN_EMAILS` environment variable, OR
   - User has `role='admin'` in `user_roles` table
4. Backend issues JWT token with `role: "admin"`
5. Admin redirected to dashboard

### Admin Role Management

Admin users are managed via database:

- **Initial setup**: Insert into `user_roles` table via SQL
- **Via admin panel**: After first admin is created, other admins can be granted access via Settings → Users
- **Via API**: `POST /api/admin/users/:userId/roles/admin`

All admin actions are logged in `audit_logs` for security and compliance.

## Order Management

### Viewing Orders

Admin can view all orders:

1. Navigate to Admin → Orders
2. View order list with filters:
   - Status filter
   - Date range filter
   - Customer search
   - Order ID search
3. Click order to view details

### Order Details

Order detail page shows:

- Order information:
  - Order ID and number
  - Order date
  - Order status
  - Payment status
  - Total amount
- Customer information:
  - Customer name and email
  - Shipping address
  - Billing address (if different)
- Order items:
  - Product name and image
  - Variant details (if applicable)
  - Quantity
  - Unit price (from order snapshot)
  - Line total
- Price breakdown:
  - Subtotal
  - Discount (if any)
  - Tax
  - Shipping
  - Total
- Shipping information:
  - Shipping status
  - Courier name
  - Tracking ID
  - Shipping timeline
- Return information:
  - Return status (if applicable)
  - Return reason (if requested)

### Updating Order Status

Admin can update order status:

1. Navigate to order detail page
2. Select new status from dropdown
3. Click "Update Status"
4. Backend validates transition via state machine
5. If valid:
   - Status updated
   - Change logged in audit_logs
   - Status history updated
6. If invalid:
   - Error shown with valid next statuses

Valid order status transitions:

- `PENDING` → `PAID`, `CANCELLED`
- `PAID` → `SHIPPED`, `CANCELLED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `RETURNED`

### Cancelling Orders

Admin can cancel orders:

1. Navigate to order detail page
2. Click "Cancel Order"
3. Backend validates:
   - Order can be cancelled (not already shipped/delivered)
   - Status allows cancellation
4. If valid:
   - Order status updated to `CANCELLED`
   - Inventory restored (if already deducted)
   - Refund initiated (if payment received)
   - Change logged in audit_logs

## Shipping Management

### Creating Shipments

Admin creates shipment for paid order:

1. Navigate to order detail page
2. Click "Create Shipment"
3. Fill in shipment details:
   - Courier name
   - Tracking ID
   - Expected delivery date (optional)
4. Click "Create Shipment"
5. Backend validates:
   - Order is paid
   - Order not already shipped
6. Backend creates shipment:
   - Updates shipping status to `PROCESSING` or `SHIPPED`
   - Stores courier and tracking information
   - Generates invoice (if configured)
   - Logs in shipping_status_history

### Updating Shipping Status

Admin updates shipping status:

1. Navigate to order detail page
2. Select new shipping status from dropdown
3. Click "Update Status"
4. Backend validates transition via state machine
5. If valid:
   - Status updated
   - Change logged in shipping_status_history
   - Admin ID recorded
6. If invalid:
   - Error shown with valid next statuses

Valid shipping status transitions:

- `NOT_SHIPPED` → `PROCESSING`, `SHIPPED`
- `PROCESSING` → `SHIPPED`
- `SHIPPED` → `IN_TRANSIT`
- `IN_TRANSIT` → `OUT_FOR_DELIVERY`
- `OUT_FOR_DELIVERY` → `DELIVERED`
- `DELIVERED` → `RETURNED`

State machine enforces sequential progression. Skipping states is not allowed.

### Shipping Status History

All shipping status changes are logged:

- Previous status
- New status
- Changed by (admin ID)
- Change timestamp
- Notes (optional)

History is visible in order detail page.

## Return Management

### Viewing Return Requests

Admin can view all return requests:

1. Navigate to Admin → Returns
2. View return list with filters:
   - Return status filter
   - Date range filter
   - Order ID search
3. Click return to view details

### Return Request Details

Return detail page shows:

- Return information:
  - Return ID
  - Return status
  - Request date
  - Return reason
  - Customer notes
- Order information:
  - Order ID and number
  - Order date
  - Order items (with return eligibility)
- Admin actions:
  - Approve/Reject buttons
  - Return instructions (if approved)
  - Inspection notes (if received)
  - Refund details (if refunded)

### Approving Returns

Admin approves return request:

1. Navigate to return detail page
2. Review return reason and customer notes
3. Click "Approve Return"
4. Provide return instructions:
   - Return address
   - Return method (pickup/shipping)
   - Instructions for customer
5. Click "Approve"
6. Backend updates status to `APPROVED`
7. Status change logged in audit_logs
8. Customer notified (if notifications configured)

### Rejecting Returns

Admin rejects return request:

1. Navigate to return detail page
2. Click "Reject Return"
3. Provide rejection reason (mandatory)
4. Click "Reject"
5. Backend updates status to `REJECTED`
6. Status change logged in audit_logs
7. Customer notified (if notifications configured)

### Processing Returns

After approval, when item is received:

1. Admin updates status to `RECEIVED`
2. Admin inspects item:
   - Verifies authenticity
   - Checks for damage
   - Confirms item matches order
3. Admin adds inspection notes
4. Status change logged in audit_logs

### Processing Refunds

After inspection, admin processes refund:

1. Admin updates status to `REFUND_INITIATED`
2. Admin processes refund (manual process):
   - Refund amount (from order snapshot)
   - Refund method (original payment method)
   - Refund reference number
   - Refund date
3. Admin updates status to `REFUNDED`
4. All status changes logged in audit_logs

Valid return status transitions:

- `NONE` → `REQUESTED`
- `REQUESTED` → `APPROVED`, `REJECTED`
- `APPROVED` → `RECEIVED`
- `RECEIVED` → `REFUND_INITIATED`
- `REFUND_INITIATED` → `REFUNDED`

## Product Management

### Creating Products

Admin creates new product:

1. Navigate to Admin → Products → Add Product
2. Fill in product details:
   - **Product name** (required)
   - **Category** (required): rings, earrings, necklaces, bracelets
   - **Base price** (required): Price in ₹ (INR)
   - **Metal type**: Gold, Silver, Diamond, Platinum
   - **Purity**: e.g., "18K", "22K", "925"
   - **Karat**: Number (e.g., 18, 22)
   - **Description**: Full product description
   - **Short description**: Brief description
   - **SKU**: Auto-generated if left empty (see SKU Management below)
   - **Active status**: Must be checked for product to appear on frontend
   - **Bestseller**: Optional flag
3. Upload product images:
   - Upload from computer (stored in Supabase Storage)
   - Or add image URL
   - First image becomes primary automatically
   - Can reorder images
4. Add variants (recommended):
   - Size, color, finish
   - Variant-specific price override (optional)
   - Variant-specific stock quantity (required)
   - Variant-specific SKU (auto-generated if empty)
   - Variant-specific images (optional)
5. Click "Save"
6. Backend validates and stores product
7. Change logged in audit_logs

### SKU Management

The platform uses intelligent auto-generation for SKUs with manual override:

**Product SKU Format**: `[CATEGORY]-[PRODUCT]-[ID]`
- Example: `RIN-SOL-a1b2` (RIN = rings, SOL = solitaire, a1b2 = first 4 chars of UUID)

**Variant SKU Format**: `[PRODUCT-SKU]-[SIZE]-[COLOR]-[FINISH]-[ID]`
- Example: `RIN-SOL-a1b2-6-GO-PO-xy` (6 = size, GO = gold, PO = polished)

**Auto-Generation Rules**:
- Category prefix: First 3 letters (uppercase)
- Product name: First 3 letters (uppercase, alphanumeric)
- Unique ID: First 4 characters of UUID
- Uniqueness: Adds counter suffix if SKU exists

**Manual Override**: Admins can manually set SKU when creating/editing products. Must be unique.

See `Documents/SKU_MANAGEMENT_GUIDE.md` for complete details.

### Product Visibility

Products appear in different places based on status:

- **Admin Panel**: All products (with filters for status, category)
- **Frontend Customer Pages**: Only products where `is_active = true`
- **Homepage/Bestseller**: Products where `is_active = true` AND `is_bestseller = true`

**Stock Calculation**:
- Stock is stored at variant level, not product level
- Admin panel shows total stock (sum of all variant stocks)
- Products without variants show stock as 0

### Updating Products

Admin updates existing product:

1. Navigate to product detail page
2. Click "Edit Product"
3. Update product details
4. Add/remove variants
5. Update images
6. Click "Save"
7. Backend validates and updates product
8. Change logged in audit_logs

### Managing Variants

Admin manages product variants:

- Add variant: Specify size, color, finish, price, stock
- Update variant: Modify price, stock, images
- Delete variant: Remove variant (only if no orders exist)

Variant changes logged in audit_logs.

### Bulk Operations

Admin can perform bulk operations:

- Bulk import: Upload CSV file with products
- Bulk export: Download products as CSV
- Bulk update: Update multiple products at once

All bulk operations logged in bulk_import_logs.

## System Configuration

### Admin Settings

Admin configures system settings:

1. Navigate to Admin → Settings
2. View settings organized by category:
   - Pricing: Tax percentage, pricing rules
   - Shipping: Shipping charges, free shipping threshold, delivery days
   - Inventory: Lock duration, low stock threshold
   - Returns: Return window, return policy
   - Checkout: Maintenance mode, checkout settings
   - State Machines: Order, shipping, return transitions
3. Update settings:
   - Click setting to edit
   - Enter new value
   - Click "Save"
4. Backend validates and updates setting
5. Config cache cleared automatically
6. Change logged in audit_logs

### State Machine Configuration

Admin configures state machine transitions:

1. Navigate to Admin → Settings → State Machines
2. Select state machine (Order, Shipping, Return)
3. View current transitions
4. Update transitions:
   - Add valid next statuses for each status
   - Remove invalid transitions
   - Save changes
5. Changes take effect immediately
6. Invalid transitions rejected based on new configuration

### Pricing Rules

Admin configures dynamic pricing rules:

1. Navigate to Admin → Pricing Rules
2. Create pricing rule:
   - Rule type (metal type, category, weight)
   - Condition (matching criteria)
   - Action type (percentage, fixed amount)
   - Action value
   - Priority (evaluation order)
3. Rules evaluated in priority order
4. First matching rule applies

## Inventory Management

### Viewing Inventory

Admin views inventory:

1. Navigate to Admin → Inventory
2. View inventory summary:
   - Total products
   - Total variants
   - Low stock items
   - Out of stock items
   - Locked inventory
3. Filter by:
   - Category
   - Stock level
   - Metal type

### Inventory Locks

Admin views and manages inventory locks:

1. Navigate to Admin → Inventory → Locks
2. View all active locks:
   - Order intent ID
   - Variant/product
   - Quantity locked
   - Expiry time
   - Status
3. Manually release lock:
   - Click "Release Lock"
   - Lock released immediately
   - Stock available for other orders

### Low Stock Alerts

Admin receives low stock alerts:

- Products/variants below threshold
- Shown in admin dashboard
- Can configure threshold in settings

## Discount Management

### Creating Discount Codes

Admin creates discount codes:

1. Navigate to Admin → Discounts → Add Discount
2. Fill in discount details:
   - Discount code (unique)
   - Discount type (flat or percentage)
   - Discount value
   - Minimum cart value
   - Maximum discount amount (for percentage)
   - Expiry date
   - Usage limit (per user, total)
   - Active status
3. Click "Save"
4. Discount code available for use

### Managing Discount Codes

Admin manages discount codes:

- View all discount codes
- Edit discount code
- Deactivate discount code
- View usage statistics

## Analytics & Reporting

### Dashboard KPIs

Admin dashboard shows:

- Total revenue (today, week, month)
- Total orders (today, week, month)
- Pending orders count
- Low stock alerts
- Abandoned carts count

### Revenue Analytics

Admin views revenue analytics:

- Revenue by metal type
- Revenue by category
- Revenue trends (daily, weekly, monthly)
- Sales comparison (period over period)

### Order Analytics

Admin views order analytics:

- Orders by status
- Orders by date range
- Average order value
- Conversion rate

### Customer Analytics

Admin views customer analytics:

- Total customers
- New customers (period)
- Customer lifetime value
- Abandoned cart rate

## Audit Trail

### Viewing Audit Logs

Admin views audit logs:

1. Navigate to Admin → Audit Logs
2. View logs with filters:
   - Entity type (order, return, product)
   - Entity ID
   - Action type
   - User (admin)
   - Date range
3. View log details:
   - Action performed
   - Entity affected
   - Old values
   - New values
   - User who performed action
   - IP address
   - Timestamp

### Audit Log Immutability

Audit logs are immutable:

- No updates allowed
- No deletes allowed
- Read-only access for all users
- Only backend can insert logs
- Complete history preserved

## Security Best Practices

### Admin Access Control

- Only grant admin role to trusted users
- Regularly review admin access
- Monitor admin login attempts
- Log all admin actions

### Data Protection

- Never expose service role keys
- Use strong JWT secrets
- Rotate secrets regularly
- Monitor audit logs for suspicious activity

### Operational Security

- Verify all state transitions
- Validate all inputs
- Log all critical actions
- Review audit logs regularly

