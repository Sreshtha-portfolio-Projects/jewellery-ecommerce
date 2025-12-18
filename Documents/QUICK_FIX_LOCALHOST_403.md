# Quick Fix: 403 Error on Localhost

## The Problem

You're getting 403 "Invalid or expired token" errors on localhost because:
- You logged in on **production** (Vercel) → token signed with production `JWT_SECRET`
- You're now testing on **localhost** → local backend has different `JWT_SECRET`
- Production token can't be verified by local backend → **403 error**

## Quick Fix (30 seconds)

### Option 1: Clear Tokens and Re-login Locally

1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.clear();
   ```
3. Refresh page
4. Login again on localhost
5. ✅ Now you have a token signed with local `JWT_SECRET`

### Option 2: Use Production Backend for Local Frontend

If you want to test with production backend:

1. Create `frontend/.env.local`:
   ```env
   VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com
   ```

2. Restart frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

3. ✅ Now localhost frontend uses production backend

## Recommended Setup

### For Local Development (Recommended)

**Frontend `.env.local`:**
```env
VITE_API_BASE_URL=http://localhost:3000
```

**Backend `.env`:**
```env
JWT_SECRET=your-local-secret-here
```

**Workflow:**
- Run backend on `localhost:3000`
- Run frontend on `localhost:5173`
- Login on localhost → get local token
- All API calls go to local backend

### For Production Testing

**Vercel Environment Variables:**
```
VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com
```

**Workflow:**
- Deploy frontend to Vercel
- Frontend uses production backend
- Login on production → get production token
- All API calls go to production backend

## Why This Happens

```
┌─────────────────┐         ┌──────────────────┐
│  Production     │         │  Localhost       │
│  (Vercel)       │         │  (localhost:3000) │
├─────────────────┤         ├──────────────────┤
│ JWT_SECRET:     │         │ JWT_SECRET:      │
│ "prod-secret"   │  ≠      │ "local-secret"   │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
   Token signed              Token verification
   with "prod-secret"        expects "local-secret"
                                    │
                                    │
                                    ▼
                            ❌ 403 Error!
```

## Prevention

1. **Use separate browser profiles:**
   - Chrome Profile 1: Local development
   - Chrome Profile 2: Production testing

2. **Or use different browsers:**
   - Chrome: Local development
   - Firefox: Production testing

3. **Or clear localStorage when switching:**
   - Always clear tokens when switching environments

## Summary

**For localhost testing:**
- ✅ Use `VITE_API_BASE_URL=http://localhost:3000`
- ✅ Clear localStorage and login locally
- ✅ Ensure local backend `JWT_SECRET` is set

**For production (Vercel):**
- ✅ Use `VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com` in Vercel env vars
- ✅ Production backend `JWT_SECRET` must match

**The code now auto-detects localhost and uses local backend by default!**
