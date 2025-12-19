# Core Flows

This document describes the complete flows for orders, shipping, returns, refunds, and invoicing.

## Order Flow

### Order Intent Creation

When a user clicks "Place Order" on the checkout page:

1. **Frontend validates cart** (client-side checks)
2. **Frontend calls** `POST /api/order-intents`
3. **Backend validates cart**:
   - Items still exist and are active
   - Stock available (considering locked inventory)
   - Prices unchanged
   - Discount code valid (if applied)
   - Checkout enabled (not in maintenance mode)
4. **If validation fails**: Return errors, frontend refreshes cart
5. **If validation succeeds**:
   - Backend calculates final price using pricing engine
   - Backend creates order intent with:
     - Cart snapshot (all items with prices)
     - Locked prices (from current product/variant prices)
     - Locked discount code (if used)
     - Expiry time (from admin_settings)
   - Backend locks inventory (creates inventory_locks)
   - Backend returns order intent ID and pricing breakdown

### Payment Processing

After order intent is created:

1. **Frontend calls** `POST /api/payments/create-order`
2. **Backend validates order intent**:
   - Order intent exists and belongs to user
   - Status is `INTENT_CREATED` (not expired, not already paid)
3. **Backend creates Razorpay order**:
   - Amount: Order intent total (converted to paise)
   - Currency: INR
   - Receipt: Order intent number
4. **Backend stores Razorpay order ID** in order intent
5. **Backend returns** Razorpay order ID, amount, and key ID to frontend
6. **Frontend opens Razorpay Checkout** modal
7. **User completes payment** via Razorpay
8. **Razorpay sends webhook** to `/api/payments/webhook`
9. **Backend verifies webhook signature**
10. **Backend processes payment**:
    - Checks idempotency (payment already processed?)
    - Verifies payment amount matches order intent
    - If payment succeeded:
      - Updates order intent status to `PAYMENT_CONFIRMED`
      - Creates order from order intent
      - Deducts inventory (converts locks to stock deduction)
      - Releases discount code lock
      - Clears user's cart
      - Logs audit trail
    - If payment failed:
      - Updates order intent status to `PAYMENT_FAILED`
      - Keeps inventory locked (will release on expiry)
      - Keeps discount code locked (will release on expiry)

### Order Status State Machine

Order statuses and valid transitions:

- `PENDING`: Initial status when order created
- `PAID`: Payment confirmed via webhook
- `SHIPPED`: Order shipped to customer
- `DELIVERED`: Order delivered to customer
- `CANCELLED`: Order cancelled (before shipping)
- `RETURNED`: Order returned by customer

Valid transitions (configurable in admin_settings):

- `PENDING` → `PAID`, `CANCELLED`
- `PAID` → `SHIPPED`, `CANCELLED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `RETURNED`

State machine is enforced in backend. Invalid transitions are rejected with error message showing valid next statuses.

### Order Intent Expiry

Order intents expire after a configurable duration (default: 30 minutes):

1. **Expiry time set** when order intent is created
2. **Background job** (or manual trigger) checks for expired intents
3. **On expiry**:
   - Order intent status updated to `EXPIRED`
   - Inventory locks released
   - Discount code lock released
   - User can create new order intent

## Shipping Flow

### Shipment Creation

Admin creates shipment for a paid order:

1. **Admin navigates** to order detail page
2. **Admin clicks** "Create Shipment"
3. **Frontend calls** `POST /api/admin/shipping/:orderId/create`
4. **Backend validates**:
   - Order exists and is paid
   - Order not already shipped
   - Shipping status is valid for shipment creation
5. **Backend creates shipment**:
   - Updates shipping status via state machine
   - Stores courier information
   - Stores tracking ID
   - Generates invoice (if configured)
   - Logs status change in shipping_status_history
6. **Backend returns** shipment details

### Shipping Status Updates

Admin updates shipping status:

1. **Admin selects** new shipping status
2. **Frontend calls** `PUT /api/admin/shipping/:orderId/status`
3. **Backend validates transition** via state machine
4. **If valid**:
   - Updates shipping status
   - Logs change in shipping_status_history
   - Records admin ID who made the change
5. **If invalid**: Returns error with valid next statuses

### Shipping Status State Machine

Shipping statuses and valid transitions:

- `NOT_SHIPPED`: Initial status
- `PROCESSING`: Order being prepared
- `SHIPPED`: Order shipped
- `IN_TRANSIT`: Order in transit
- `OUT_FOR_DELIVERY`: Out for delivery
- `DELIVERED`: Delivered to customer
- `RETURNED`: Returned to seller

Valid transitions (configurable in admin_settings):

- `NOT_SHIPPED` → `PROCESSING`, `SHIPPED`
- `PROCESSING` → `SHIPPED`
- `SHIPPED` → `IN_TRANSIT`
- `IN_TRANSIT` → `OUT_FOR_DELIVERY`
- `OUT_FOR_DELIVERY` → `DELIVERED`
- `DELIVERED` → `RETURNED`

State machine enforces sequential progression. Skipping states is not allowed.

### Customer Order Tracking

Customer views order status:

1. **Customer navigates** to order detail page
2. **Frontend calls** `GET /api/orders/:id`
3. **Backend validates** order belongs to user
4. **Backend returns** order with shipping status and timeline
5. **Frontend displays** status and timeline

## Returns & Refunds Flow

### Return Request

Customer requests return for delivered order:

1. **Customer navigates** to order detail page
2. **Customer clicks** "Request Return" (only visible if order is delivered)
3. **Backend validates**:
   - Order shipping status is `DELIVERED`
   - Return window not expired (from delivery date)
   - No existing return request for this order
4. **Customer submits return request**:
   - Return reason (dropdown: Size issue, Damaged item, Not as expected)
   - Optional note
5. **Frontend calls** `POST /api/returns`
6. **Backend creates return request**:
   - Status: `REQUESTED`
   - Links to order
   - Stores reason and note
   - Logs in audit_logs
7. **Customer cannot edit** request after submission

### Return Approval/Rejection

Admin reviews return request:

1. **Admin navigates** to returns list
2. **Admin views** return request details
3. **Admin approves or rejects**:
   - If approved:
     - Status updated to `APPROVED`
     - Admin provides return instructions and address
     - Logged in audit_logs
   - If rejected:
     - Status updated to `REJECTED`
     - Admin must provide rejection reason
     - Logged in audit_logs

### Item Received & Inspection

After approval, when item is received:

1. **Admin updates** return status to `RECEIVED`
2. **Admin inspects item**:
   - Verifies authenticity
   - Checks for damage
   - Confirms item matches order
3. **Status change logged** in audit_logs

### Refund Processing

After inspection, admin processes refund:

1. **Admin updates** return status to `REFUND_INITIATED`
2. **Admin processes refund** (manual process, gateway integration later):
   - Refund amount from order snapshot
   - Refund reference number
   - Refund date
3. **Admin updates** return status to `REFUNDED`
4. **All status changes logged** in audit_logs

### Return Status State Machine

Return statuses and valid transitions:

- `NONE`: No return request
- `REQUESTED`: Customer requested return
- `APPROVED`: Admin approved return
- `REJECTED`: Admin rejected return
- `RECEIVED`: Item received by seller
- `REFUND_INITIATED`: Refund process started
- `REFUNDED`: Refund completed

Valid transitions (configurable in admin_settings):

- `NONE` → `REQUESTED`
- `REQUESTED` → `APPROVED`, `REJECTED`
- `APPROVED` → `RECEIVED`
- `RECEIVED` → `REFUND_INITIATED`
- `REFUND_INITIATED` → `REFUNDED`

State machine enforces sequential progression. No skipping states allowed.

### Return Window

Return window is configurable in admin_settings:

- Default: 7 days from delivery date
- Window calculated from `delivered_at` timestamp
- Return requests after window expiry are rejected
- Window can be updated via admin panel

## Invoicing Flow

### Invoice Generation

Invoice is generated automatically when shipment is created:

1. **Admin creates shipment** for paid order
2. **Backend generates invoice**:
   - Uses order snapshot (immutable data)
   - Includes all order items with prices at time of order
   - Includes tax, shipping, discount breakdown
   - Generates PDF
   - Stores PDF in secure storage
   - Links invoice to order
3. **Invoice is immutable**: Never regenerated or modified

### Invoice Access

Both customer and admin can access invoices:

1. **Customer**: Via order detail page
   - `GET /api/orders/:id/invoice`
   - Returns PDF download
2. **Admin**: Via admin order detail page
   - `GET /api/admin/orders/:id/invoice`
   - Returns PDF download

### Invoice Data

Invoice contains:

- Invoice number (unique)
- Order number
- Order date
- Customer details (name, address)
- Order items with:
  - Product name
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
- Payment details
- Invoice generation date

## Price Calculation Flow

### Pricing Engine

All prices calculated server-side using pricing engine:

1. **Backend receives** cart items
2. **Backend calculates**:
   - Subtotal: Sum of all item prices (with variant overrides if applicable)
   - Discount: Applied if coupon code valid (flat or percentage)
   - Tax: GST percentage from admin_settings
   - Shipping: Based on free shipping threshold from admin_settings
   - Total: Subtotal - Discount + Tax + Shipping
3. **All calculations logged** in pricing_calculation_logs for audit
4. **Prices locked** in order intent snapshot

### Dynamic Pricing Rules

Pricing rules can be configured in admin panel:

- Metal type-based pricing
- Category-based pricing
- Weight-based pricing
- Custom rules via JSON configuration

Rules are evaluated in order and first matching rule applies.

### Price Locking

Prices are locked when order intent is created:

- Product prices stored in order intent snapshot
- Variant prices stored in order intent snapshot
- Discount amount locked
- Final prices cannot change after order intent creation
- Order uses locked prices, not current product prices

## Inventory Management Flow

### Inventory Locking

When order intent is created:

1. **Backend locks inventory** for each cart item
2. **Creates inventory_locks**:
   - Links to order intent
   - Specifies variant (or product if no variant)
   - Quantity locked
   - Expiry time
   - Status: `LOCKED`
3. **Locked inventory** is not available for other orders
4. **Locks expire** when order intent expires or is cancelled

### Inventory Deduction

When payment succeeds:

1. **Backend converts locks to stock deduction**
2. **Updates variant/product stock**:
   - Decrements stock_quantity
   - Marks inventory locks as `CONVERTED`
3. **Stock permanently deducted** from available inventory

### Inventory Release

Inventory is released when:

- Order intent expires (automatic)
- Order intent is cancelled (manual or automatic)
- Payment fails (locks remain until expiry)

## Cart Revalidation Flow

Before creating order intent, cart is revalidated:

1. **Frontend calls** `POST /api/order-intents`
2. **Backend validates each cart item**:
   - Variant/product still exists and is active
   - Stock available (considering locked inventory)
   - Price unchanged (within tolerance)
   - Discount code still valid (if applied)
3. **If validation fails**:
   - Returns errors for each invalid item
   - Frontend refreshes cart
   - User can remove invalid items or update cart
4. **If validation succeeds**:
   - Proceeds with order intent creation

## Error Handling in Flows

### Order Intent Errors

- **Cart validation failed**: Return specific errors, user can fix cart
- **Stock unavailable**: Return which items unavailable, user can remove
- **Price changed**: Return price differences, user can confirm or cancel
- **Discount invalid**: Return reason, user can remove discount or update cart

### Payment Errors

- **Payment failed**: Order intent remains valid, user can retry
- **Webhook verification failed**: Payment not confirmed, order remains pending
- **Amount mismatch**: Logged as warning, payment still processed (within tolerance)

### Shipping Errors

- **Invalid status transition**: Return error with valid next statuses
- **Order not paid**: Cannot create shipment, return error
- **Already shipped**: Return error, shipment already exists

### Return Errors

- **Not delivered**: Cannot request return, return error
- **Return window expired**: Cannot request return, return error
- **Duplicate request**: Return request already exists, return error
- **Invalid status transition**: Return error with valid next statuses

