# 🟠 PHASE 2 — RETURNS, REFUNDS & CUSTOMER TRUST  
## Aldorado Jewells – Cursor Coding Prompt (Skeleton Phase)

This phase focuses on **customer trust and operational clarity**, not automation.  
The goal is to **avoid support chaos** by making order status, returns, and refund expectations clear inside the app UI.

---

## 🔄 PROMPT: RETURNS & REFUNDS FLOW (SKELETON FIRST)

### PROJECT CONTEXT (LOCKED – DO NOT CHANGE)

You are extending the existing **Aldorado Jewells** e-commerce platform.

Already implemented:
- Payments
- Order Confirmation page
- Order Detail page
- In-house shipping & tracking system
- Admin-managed order lifecycle

❌ Do NOT automate refunds  
❌ Do NOT integrate payment gateway refunds  
✅ Build skeleton + admin-controlled flow only  

---

### GOAL OF THIS FEATURE

Implement a **basic but reliable Returns & Refund system** that:
- Allows users to request returns
- Allows admins to review and control outcomes
- Clearly communicates refund expectations
- Is safe, auditable, and expandable later

---

## 1️⃣ USER-SIDE: RETURN REQUEST

### Location
My Account → Orders → Order Detail

markdown
Copy code

### Conditions
- Return allowed only if:
shipping_status = DELIVERED

yaml
Copy code
- Return window (e.g. 7 days) must be **admin-configurable**

---

### UI: “Request Return” Button

On click:
- Show return request form

User inputs:
- Return reason (dropdown)
- Size issue
- Damaged item
- Not as expected
- Other
- Optional comment

On submit:
- Create a Return Request
- Set:
return_status = REQUESTED

yaml
Copy code
- Disable further edits by user

---

## 2️⃣ RETURN STATUS TRACKING (USER VISIBILITY)

User must see:
- Current return status
- Status history (simple timeline)
- Admin messages (if any)

### Return Status States
NONE
→ REQUESTED
→ APPROVED / REJECTED
→ RECEIVED
→ REFUND_INITIATED
→ REFUNDED

yaml
Copy code

⚠️ User cannot move or change states.

---

## 3️⃣ ADMIN-SIDE: RETURN MANAGEMENT

### Admin Returns List

Display:
- Order ID
- Customer name
- Return reason
- Request date
- Current return status

---

### Admin Actions

Admin can:
- Approve return
- Reject return (mandatory reason)

If approved:
- Provide return instructions (text)
- Update status to:
APPROVED

yaml
Copy code

---

### Inspection & Refund Placeholder

After item is received:
- Admin updates:
RECEIVED

yaml
Copy code

Then:
- Admin marks:
REFUND_INITIATED
→ REFUNDED

yaml
Copy code

⚠️ No payment gateway logic in this phase  
⚠️ Refund reference can be manual text

---

## 4️⃣ SECURITY & RULES (MANDATORY)

- Only admin can approve/reject returns
- Refund amount must come from order snapshot
- No auto refunds
- All state changes must be logged

---

## 🚫 DO NOT IMPLEMENT IN THIS PHASE

- Refund automation
- Partial refunds
- Pickup scheduling
- Notifications (email/SMS)

---

## ✅ SUCCESS CRITERIA (RETURNS)

- Users can request returns confidently
- Admin controls decisions
- Refund expectations are clear
- Support dependency reduced

---

---

# 💬 PROMPT: CUSTOMER COMMUNICATION (UI-LEVEL)

### GOAL

Reduce user confusion by **clearly communicating order and return status inside the app UI**, without notifications or automation.

---

## REQUIRED STATUS MESSAGES (UI ONLY)

Implement consistent, friendly messages for:

### Order Lifecycle
- **Order Placed**
> “Your order has been placed successfully.”
- **Shipped**
> “Your jewellery has been shipped.”
- **Delivered**
> “Your order has been delivered.”

---

### Return Lifecycle
- **Return Requested**
> “Your return request has been submitted and is under review.”
- **Return Approved**
> “Your return request has been approved. Please follow the instructions.”
- **Refund Initiated**
> “Your refund has been initiated.”
- **Refund Completed**
> “Your refund has been completed.”

---

## WHERE TO SHOW THESE MESSAGES

- Order Detail page
- Orders list (short status badge)
- Return detail section (if return exists)

---

## UI REQUIREMENTS

- Messages must be:
- Calm
- Clear
- Non-technical
- No raw system terms
- No gateway error messages
- Consistent wording across app

---

## 🚫 DO NOT ADD

- Email triggers
- SMS / WhatsApp
- Push notifications
- Automated reminders

---

## ✅ SUCCESS CRITERIA (COMMUNICATION)

- Users always know:
- What happened
- What is happening
- What happens next
- Reduced “Where is my order?” queries
- App feels trustworthy and transparent

---

## 🔜 NEXT RECOMMENDED PHASE

- Refund gateway integration
- Credit note system
- Return analytics
- Customer support tickets

---

**NOTE:**  
This phase is about **clarity over automation**.  
Clear UI communication solves more problems than notifications.