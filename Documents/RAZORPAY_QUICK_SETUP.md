# Razorpay Quick Setup Guide - You're Already Halfway There! 🎉


API KEY = rzp_test_RsoH0eYG1eQ6Sy
Test KEY SECRET+ HLgHgnKobgPYW49o8clgJWJV
**Good news**: Your code is already configured for Razorpay! You just need to add your keys and set up the webhook.

## ✅ What You've Already Done
- ✅ Created Razorpay account
- ✅ On test dashboard
- ✅ Code is already set up (no changes needed)

## 📋 What You Need to Do Now

### Step 1: Get Your Test Keys from Razorpay Dashboard

Since you're already on the test dashboard:

1. **Go to**: Settings → API Keys
2. **You'll see two keys**:
   - **Key ID**: Starts with `rzp_test_...` (this is safe to share)
   - **Key Secret**: Long string (click "Reveal" to see it - **keep this secret!**)

3. **Copy both keys** - you'll need them in the next step

### Step 2: Add Keys to Render (Backend)

1. **Go to Render Dashboard** → Your backend service → **Environment** tab
2. **Add/Update these environment variables**:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

**Important**: 
- Replace `rzp_test_xxxxxxxxxxxxx` with your actual Key ID from Razorpay
- Replace `xxxxxxxxxxxxxxxxxxxxx` with your actual Key Secret from Razorpay
- No quotes needed, just paste the values directly

3. **Save** the environment variables

### Step 3: Set Up Webhook URL

**First, find your Render backend URL:**
- It should be something like: `https://your-backend-name.onrender.com`
- If you're not sure, check your Render dashboard → Your service → the URL is shown at the top

**Then configure in Razorpay:**

1. **Go to Razorpay Dashboard** → Settings → Webhooks
2. **Click "Add New Webhook"**
3. **Configure**:
   - **URL**: `https://your-backend-name.onrender.com/api/payments/webhook https://jewellery-ecommerce-9xs1.onrender.com/api/payments/webhook
     - Replace `your-backend-name` with your actual Render service name
     - Example: `https://jewellery-ecommerce-backend.onrender.com/api/payments/webhook`
     Secret webhook -3ygHXJ_5simk_Rp
   - **Active Events**: Select these:
     - ✅ `payment.captured` (when payment succeeds)
     - ✅ `payment.failed` (when payment fails)
     - ✅ `order.paid` (optional, but recommended)
4. **Click "Create Webhook"**
5. **Copy the Webhook Secret** - Razorpay will show it (starts with `whsec_...`)

### Step 4: Add Webhook Secret to Render

1. **Go back to Render** → Your backend service → **Environment** tab
2. **Add/Update**:
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
(Replace with the secret you copied from Razorpay)

3. **Save** the environment variable

### Step 5: Redeploy Backend

1. **In Render Dashboard** → Your backend service
2. **Click "Manual Deploy"** → **"Deploy latest commit"**
3. **Wait for deployment** (usually 1-2 minutes)

### Step 6: Test It! 🧪

1. **Visit your frontend**: `https://your-project.vercel.app`
2. **Add items to cart** and go to checkout
3. **Try a test payment**:
   - Use Razorpay test card: `4111 1111 1111 1111`
   - Any future expiry date (e.g., 12/25)
   - Any CVV (e.g., 123)
   - Any name
4. **Check Razorpay Dashboard** → Webhooks → Recent Deliveries to see if webhook was received

## ✅ That's It!

Your Razorpay integration is now fully configured for **test mode**. You can:
- ✅ Accept test payments
- ✅ Test the full payment flow
- ✅ Verify webhooks are working

## 🔄 Later: Switch to Live Mode (When Ready)

When you're ready to accept real payments:

1. **In Razorpay Dashboard**: Switch from "Test Mode" to "Live Mode"
2. **Get Live Keys**: Settings → API Keys → Copy Live Mode keys
3. **Update Render**: Replace test keys with live keys in environment variables
4. **Update Webhook**: Create a new webhook URL (or update existing) for live mode
5. **Redeploy**: Redeploy backend on Render

**Important**: Test thoroughly in test mode first! Only switch to live when everything works perfectly.

## 🆘 Troubleshooting

**Problem: "Invalid Key ID" error**
- ✅ Check you copied the full Key ID (starts with `rzp_test_...`)
- ✅ Make sure there are no extra spaces in Render environment variables
- ✅ Verify you're using Test Mode keys (not Live Mode)

**Problem: Webhooks not received**
- ✅ Check webhook URL is correct in Razorpay dashboard
- ✅ Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- ✅ Check Render logs for webhook requests
- ✅ Make sure webhook URL uses `https://` (not `http://`)

**Problem: Payment modal doesn't open**
- ✅ Check browser console for errors
- ✅ Verify `RAZORPAY_KEY_ID` is set correctly in backend
- ✅ Check that frontend can reach backend API

---

**Need Help?** Check the full deployment guide: `Documents/DEPLOYMENT_GUIDE.md`
