# Environment Setup Guide - Frontend API Configuration

## Problem

You're getting 403 errors on localhost because:
- Tokens created on production (Vercel) are signed with production `JWT_SECRET`
- Local backend uses a different `JWT_SECRET`
- Production tokens can't be verified by local backend → 403 error

## Solution: Environment-Specific API URLs

### For Local Development
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **JWT_SECRET**: Must match between local frontend and local backend

### For Production (Vercel)
- **Frontend**: `https://jewellery-ecommerce-nine.vercel.app`
- **Backend API**: `https://jewellery-ecommerce-9xs1.onrender.com`
- **JWT_SECRET**: Must match between production frontend and production backend

## Setup Instructions

### Step 1: Create Frontend Environment Files

Create these files in `frontend/` directory:

**`frontend/.env.local`** (for local development):
```env
VITE_API_BASE_URL=http://localhost:3000
```

**`frontend/.env.production`** (for Vercel deployment):
```env
VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com
```

**`frontend/.env`** (optional, fallback):
```env
# This is the default if no other env file matches
VITE_API_BASE_URL=http://localhost:3000
```

### Step 2: Add to .gitignore

Make sure `.env.local` is in `.gitignore` (it should be by default):
```
frontend/.env.local
```

**DO NOT** add `.env.production` to `.gitignore` - Vercel needs it.

### Step 3: Configure Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   VITE_API_BASE_URL = https://jewellery-ecommerce-9xs1.onrender.com
   ```
5. Select **Production**, **Preview**, and **Development** environments
6. Save and redeploy

### Step 4: Ensure JWT_SECRET Matches

**For Local Development:**
- `backend/.env`: `JWT_SECRET=your-local-secret`
- Use the same secret for local testing

**For Production:**
- Render Environment Variables: `JWT_SECRET=your-production-secret`
- Must match the secret used to sign tokens in production

## Quick Fix for Current Issue

If you're testing locally right now:

1. **Clear localStorage** (to remove production tokens):
   ```javascript
   // In browser console
   localStorage.clear();
   ```

2. **Login again on localhost** (this creates a token with local JWT_SECRET)

3. **Or use production URL** for local frontend:
   - Create `frontend/.env.local` with:
     ```
     VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com
     ```
   - Restart frontend dev server

## Best Practice: Auto-Detect Environment

You can also make the frontend automatically detect which backend to use:

```javascript
// frontend/src/services/api.js
const getApiBaseUrl = () => {
  // If explicitly set in env, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect: if running on localhost, use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Otherwise use production backend
  return 'https://jewellery-ecommerce-9xs1.onrender.com';
};

const rawApiBaseUrl = getApiBaseUrl();
```

## Testing Checklist

### Local Development
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Backend runs on `http://localhost:3000`
- [ ] `frontend/.env.local` has `VITE_API_BASE_URL=http://localhost:3000`
- [ ] `backend/.env` has `JWT_SECRET` set
- [ ] Login works and tokens are valid
- [ ] No 403 errors

### Production (Vercel)
- [ ] Frontend deployed on Vercel
- [ ] Vercel environment variable `VITE_API_BASE_URL` set to Render URL
- [ ] Render backend has `JWT_SECRET` set
- [ ] Login works on production
- [ ] No 403 errors

## Troubleshooting

### Issue: Still getting 403 on localhost

**Solution:**
1. Clear browser localStorage
2. Check `backend/.env` has `JWT_SECRET` set
3. Restart backend server
4. Login again on localhost

### Issue: Production tokens work but local don't

**Solution:**
- Your local `JWT_SECRET` might be wrong
- Check `backend/.env` matches what you expect
- Regenerate if needed: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Issue: Vercel still using localhost API

**Solution:**
- Check Vercel environment variables are set
- Redeploy after setting environment variables
- Check build logs to verify env vars are loaded

## Summary

**For Local Development:**
- Use `VITE_API_BASE_URL=http://localhost:3000` in `.env.local`
- Ensure local backend `JWT_SECRET` matches

**For Production (Vercel):**
- Use `VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com` in Vercel env vars
- Ensure Render backend `JWT_SECRET` matches

**Always:**
- Clear localStorage when switching between environments
- Or use separate browser profiles for local vs production testing
