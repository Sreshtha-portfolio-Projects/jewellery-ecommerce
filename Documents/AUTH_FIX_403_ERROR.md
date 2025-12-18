# Fix for 403 Forbidden Error on Login

## Problem

After login, the `/api/auth/me` endpoint returns 403 Forbidden with "Invalid or expired token" error.

## Root Causes

1. **JWT_SECRET Mismatch**: The JWT_SECRET environment variable on Render might be different from what was used to sign the token, or it might not be set at all.

2. **Timing Issue**: The token might not be available in localStorage when the axios interceptor tries to add it to the request header.

3. **Token Format Issue**: The token might not be properly formatted in the Authorization header.

## Solutions Applied

### 1. Frontend Fix (AuthContext.jsx)

- Added a small delay (100ms) after storing the token to ensure localStorage is updated
- Added fallback to use user data from login response if profile fetch fails
- Added better error handling and logging

### 2. Backend Fix (auth.js middleware)

- Added detailed error logging for JWT verification failures
- Added error details in development mode to help debug

## Verification Steps

### Step 1: Check JWT_SECRET on Render

1. Go to Render Dashboard
2. Select your backend service
3. Go to Environment tab
4. Verify `JWT_SECRET` is set
5. **IMPORTANT**: Make sure it matches the secret used in your local environment

### Step 2: Check Token Storage

1. After login, open browser DevTools
2. Go to Application/Storage → Local Storage
3. Verify `customerToken` is stored
4. Copy the token value

### Step 3: Test Token Manually

You can test the token manually using curl or Postman:

```bash
curl -X GET https://jewellery-ecommerce-9xs1.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 4: Check Backend Logs

Check Render logs for JWT verification errors. You should see detailed error messages if the secret doesn't match.

## Quick Fix for Production

If the issue persists, ensure JWT_SECRET is set correctly on Render:

1. **On Render Dashboard:**
   - Go to your backend service
   - Environment tab
   - Add/Update `JWT_SECRET` variable
   - Use a strong, random secret (at least 32 characters)
   - Save and redeploy

2. **Generate a new secret:**
   ```bash
   # On Linux/Mac
   openssl rand -base64 32
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Update both environments:**
   - Set the same JWT_SECRET in both local `.env` and Render environment variables
   - Restart backend service on Render

## Alternative: Use Login Response Data

The code now falls back to using user data from the login response if profile fetch fails. This allows login to succeed even if `/api/auth/me` fails, though you should still fix the root cause.

## Testing

After applying fixes:

1. Clear browser localStorage
2. Try logging in again
3. Check browser console for errors
4. Check Render logs for JWT errors
5. Verify user is logged in and can access protected routes

## Prevention

- Always use the same JWT_SECRET across all environments (local, staging, production)
- Store JWT_SECRET in environment variables, never in code
- Use strong, randomly generated secrets
- Document the secret generation process for your team
