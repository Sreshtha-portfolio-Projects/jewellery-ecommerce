# Quick Test Reference - Order Confirmation

## 🚀 Quick Start (30 seconds)

1. **Enable test mode:**
   ```bash
   # Add to backend/.env
   ENABLE_TEST_MODE=true
   NODE_ENV=development
   ```

2. **Restart backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test the flow:**
   - Add items to cart
   - Go to checkout
   - Click "🧪 Test Payment" button (yellow button below "Proceed to Payment")
   - You'll be redirected to confirmation page automatically!

## 📍 Test Endpoints

### Backend Test Endpoint
```
POST http://localhost:3000/api/payments/test/simulate-payment
Headers: Authorization: Bearer YOUR_JWT_TOKEN
Body: { "orderIntentId": "uuid-here" }
```

### Confirmation Endpoint
```
GET http://localhost:3000/api/orders/{orderId}/confirmation
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

## ✅ Quick Verification Checklist

After test payment, verify:

- [ ] Redirected to `/orders/{orderId}/confirmation`
- [ ] Success message displayed
- [ ] Order ID shown and copyable
- [ ] All items displayed with images
- [ ] Variant info shown (if applicable)
- [ ] Price breakdown accurate
- [ ] Address displayed correctly
- [ ] Timeline shows "Processing" in progress
- [ ] Estimated delivery date shown
- [ ] Page refresh works
- [ ] Direct URL access works

## 🔧 Troubleshooting

**Test button not showing?**
- Check `import.meta.env.DEV` is true (Vite development mode)
- Restart frontend dev server

**403 error on test endpoint?**
- Check `ENABLE_TEST_MODE=true` in backend/.env
- Check `NODE_ENV=development`
- Restart backend server

**Order not found?**
- Check backend logs
- Verify order was created in database
- Check order ID in URL is correct

## 📚 Full Documentation

- **Local Testing Guide**: `Documents/LOCAL_TESTING_GUIDE.md`
- **Complete Test Flow (STR)**: `Documents/TEST_FLOW_STR.md`
