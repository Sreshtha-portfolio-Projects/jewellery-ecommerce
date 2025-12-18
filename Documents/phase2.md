# 🚚 Shipping & Tracking System  
## Aldorado Jewells

This document defines the **Shipping & Order Tracking system** for Aldorado Jewells.  
It focuses on **reliability, clarity, and scalability**, similar to Myntra / Flipkart.

---

## 🎯 GOAL

- Enable admins to ship orders confidently  
- Integrate courier services via a clean abstraction layer  
- Allow customers to track orders transparently  
- Prepare the system for returns and refunds  

---

## 🧱 CORE ARCHITECTURE

### Courier Abstraction Layer (MANDATORY)

Implement a pluggable courier service:

CourierService
├─ ShiprocketProvider
├─ DelhiveryProvider
├─ ManualProvider

yaml
Copy code

**Rules:**
- Courier logic must be isolated from controllers
- Switching courier providers must not affect order logic
- Manual provider acts as fallback

---

## 🚚 SHIPPING FLOW (END-TO-END)

1. Order status becomes `PAID`
2. Admin clicks **Create Shipment**
3. Backend:
   - Validates order & delivery address
   - Sends shipment request to courier API
   - Receives:
     - Courier name
     - Tracking ID
     - Initial shipment status
4. Order updated with shipment details
5. Courier updates shipment status via:
   - Webhook (preferred)
   - Polling (fallback)
6. User sees updated tracking in profile

---

## 📦 SHIPPING STATUS FLOW (STRICT)

NOT_SHIPPED
→ SHIPPED
→ IN_TRANSIT
→ OUT_FOR_DELIVERY
→ DELIVERED
→ RETURNED

yaml
Copy code

- No state skipping
- Every transition logged

---

## 👤 CUSTOMER-SIDE ORDER TRACKING

### Location
Profile → Orders → Order Details

yaml
Copy code

### Display
- Courier name
- Tracking number
- Current shipment status
- Status timeline
- Last updated timestamp

**UX Principles:**
- Calm and clear
- No technical jargon
- Similar to Myntra-style tracking

---

## 🧑‍💼 ADMIN-SIDE SHIPPING VIEW

Admin must be able to:
- View shipment status per order
- See tracking ID and courier name
- Manually update status (fallback)
- Re-sync courier status

---

## 🔐 SECURITY & RELIABILITY

- Courier webhooks must be verified
- Order ownership enforced
- Idempotent webhook handling
- All status changes logged

---

## 🚫 NOT INCLUDED IN THIS PHASE

- International shipping
- Auto courier selection
- Shipping cost calculation logic
- RTO optimization

---

## ✅ SUCCESS CRITERIA

- Admin can ship orders without confusion
- Customers can track orders reliably
- Courier system is provider-agnostic
- System is ready for returns & refunds

---

# 🧑‍💼 Admin Order Fulfillment System  
## Aldorado Jewells

This document defines **Admin Order Fulfillment**, turning the platform into a **real operational tool**.

---

## 🎯 GOAL

Enable admins to:
- Manage orders end-to-end
- Process shipments
- Track fulfillment status
- Handle operational exceptions

---

## 📋 ADMIN ORDER MANAGEMENT

### Orders List Page

Display:
- Order ID
- Customer name
- Order date
- Order value
- Payment status
- Fulfillment status

Filters:
- Date range
- Order status
- Payment status

---

### Order Detail Page (Admin)

Must include:
- Immutable order snapshot
- Items & selected variants
- Payment details
- Delivery address
- Shipping & tracking details
- Full status timeline
- Admin internal notes

---

## 🔄 ORDER STATE MANAGEMENT (STRICT)

Admin-controlled lifecycle:

PAID
→ PROCESSING
→ SHIPPED
→ DELIVERED
→ RETURNED

yaml
Copy code

**Rules:**
- No skipping states
- Confirmation required for each change
- All transitions audited

---

## 🧠 ADMIN ACTIONS

Admin must be able to:
- Mark order as Processing
- Create shipment
- Mark as Shipped / Delivered
- Handle failed deliveries (future-ready)
- Add internal notes (not visible to user)

---

## 📊 OPERATIONAL VISIBILITY

Enhance admin dashboard with:
- Orders pending shipment
- Orders shipped today
- Orders delivered today
- Orders stuck in processing

---

## 🔐 AUDIT & SAFETY

- Role-based access control
- Audit logs for every admin action
- Prevent duplicate fulfillment
- Manual override requires reason

---

## 🚫 NOT INCLUDED IN THIS PHASE

- Refund execution
- Automated RTO handling
- Warehouse management
- SLA penalties

---

## ✅ SUCCESS CRITERIA

- Admin can fulfill orders without ambiguity
- Order states are consistent and traceable
- Operations scale cleanly with volume
- System is ready for returns & refunds

---

## 🔜 RECOMMENDED NEXT STEPS

1. Returns & Refund Flow  
2. Admin Analytics & Operations Dashboard  
3. Courier SLA & performance tracking  

---

**Note:**  
Shipping & fulfillment are operational foundations.  
They must prioritize **clarity, correctness, and auditability** over speed.