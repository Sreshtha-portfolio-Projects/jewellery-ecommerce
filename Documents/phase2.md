# 🧠 Cursor Coding Prompts  
## Aldorado Jewells – Returns & Refunds + Invoice PDF Generation

This document contains **two production-grade Cursor coding prompts**.  
Each prompt is written to be pasted **directly into Cursor** and executed independently.

---

# 🔄 PROMPT 1: RETURNS & REFUNDS SYSTEM  
## Aldorado Jewells – Admin-Controlled Returns & Refund Flow

---

## PROJECT CONTEXT (LOCKED – DO NOT CHANGE)

You are extending an existing **Aldorado Jewells** luxury jewellery e-commerce platform.

Already implemented:
- React (JSX) frontend with Tailwind
- Node.js + Express backend
- Supabase (Postgres + Auth) via backend only
- JWT authentication
- Payments completed
- Order Detail page exists
- In-house shipping & tracking system implemented

❌ Do NOT automate refunds  
❌ Do NOT allow instant refunds  
✅ Returns & refunds must be **admin-controlled**

---

## GOAL OF THIS FEATURE

Implement a **secure, auditable Returns & Refund system** where:
- Users can request returns
- Admin reviews and approves/rejects
- Refunds are processed manually (gateway integration later)
- All actions are logged

This system must be **jewellery-appropriate**, not fashion-style.

---

## RETURN FLOW (STRICT)

Allowed only if:
order.shipping_status = DELIVERED

yaml
Copy code

Return window:
- Admin-configurable (e.g. 7 days)

---

## USER-SIDE IMPLEMENTATION

### Location
My Account → Orders → Order Detail

yaml
Copy code

### User Action
Add **“Request Return”** button.

User submits:
- Return reason (dropdown)
  - Size issue
  - Damaged item
  - Not as expected
- Optional note

On submit:
- Create Return Request
- Status = `REQUESTED`
- User cannot edit request after submission

---

## ADMIN-SIDE IMPLEMENTATION

### Admin Returns List
Show:
- Order ID
- Customer name
- Return reason
- Request date
- Return status

---

### Admin Return Actions

Admin can:
- Approve return
- Reject return (mandatory reason)

If approved:
return_status = APPROVED

yaml
Copy code

Admin provides:
- Return instructions (text)
- Return address

---

### Item Received & Inspection

Admin manually updates:
return_status = RECEIVED

yaml
Copy code

After inspection:
- Verify authenticity
- Check damage

---

### Refund Lifecycle

Admin updates:
REFUND_INITIATED → REFUNDED

yaml
Copy code

Store:
- Refund amount
- Refund date
- Refund reference (manual for now)

---

## RETURN STATE MACHINE (MANDATORY)

NONE
→ REQUESTED
→ APPROVED / REJECTED
→ RECEIVED
→ REFUND_INITIATED
→ REFUNDED

yaml
Copy code

No skipping states.

---

## SECURITY & INTEGRITY

- Only admin can approve/reject
- Refund amount must come from order snapshot
- User cannot trigger refunds
- All actions audited

---

## DO NOT IMPLEMENT YET

- Auto refunds
- Partial refunds
- Pickup scheduling
- Notifications

Design so these can be added later.

---

## SUCCESS CRITERIA

- Users can request returns
- Admin controls entire flow
- Refunds are traceable
- No automated money movement

---

# 📄 PROMPT 2: INVOICE PDF GENERATION  
## Aldorado Jewells – Immutable Invoice System

---

## PROJECT CONTEXT (LOCKED – DO NOT CHANGE)

You are extending the same Aldorado Jewells platform.

Already implemented:
- Payments completed
- Order snapshots immutable
- Order Detail page exists

Invoices must be **legally reliable** and **unchangeable**.

---

## GOAL OF THIS FEATURE

Implement **backend-generated Invoice PDFs** that:
- Are created once per order
- Reflect exact order snapshot
- Are downloadable by user & admin
- Are stored securely

---

## WHEN TO GENERATE INVOICE

Choose ONE trigger:
- After payment success
OR
- After shipment creation (preferred for jewellery)

Invoice must never be regenerated.

---

## BACKEND IMPLEMENTATION

On trigger:
- Generate PDF using order snapshot
- Store PDF in secure storage
- Save:
  - invoice_id
  - invoice_url
  - invoice_created_at
- Link invoice to order

---

## INVOICE CONTENT (MANDATORY)

### Seller Details
- Store name
- Address
- GST number (if applicable)

### Buyer Details
- Customer name
- Billing address
- Shipping address

### Order Details
- Order ID
- Order date
- Invoice date

### Line Items
For each item:
- Product name
- Variant details
- Quantity
- Unit price
- Tax per item

### Totals
- Subtotal
- Discount
- Tax
- Shipping
- **Final amount paid**

---

## USER-SIDE ACCESS

Location:
My Account → Orders → Order Detail

yaml
Copy code

Add:
- “Download Invoice” button

Rules:
- Invoice always available after creation
- Read-only
- No edits

---

## ADMIN-SIDE ACCESS

Admin can:
- Download any invoice
- View invoice metadata

---

## SECURITY & COMPLIANCE

- Invoice tied permanently to order ID
- No frontend-generated PDFs
- User can access only their invoice
- Invoice remains valid even after refund

Refunds must NOT modify invoice.

---

## DO NOT IMPLEMENT

- Invoice regeneration
- Editable invoices
- Credit notes (future phase)
- Dynamic tax recalculation

---

## SUCCESS CRITERIA

- Invoice generated once
- PDF reflects order snapshot exactly
- Users trust invoice for records
- System is compliant & auditable

---

## NEXT RECOMMENDED FEATURES

1. Refund gateway integration
2. Credit note generation
3. Return analytics
4. Admin compliance dashboard

---

**Note:**  
Returns & invoices are **legal and financial systems**.  
Precision and auditability matter more than speed.