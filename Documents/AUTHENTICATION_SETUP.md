# Authentication System Setup Guide
## Aldorado Jewels - Email/Password + Google OAuth Implementation

This document outlines all changes made and the procedures you need to follow to complete the authentication system setup.

---

## Table of Contents

1. [Changes Summary](#changes-summary)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Supabase Configuration](#supabase-configuration)
5. [Environment Variables](#environment-variables)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Changes Summary

### Backend Changes

#### New/Updated Files:
- `backend/src/controllers/customerAuthController.js` - Extended with:
  - Mobile field support in signup
  - Google OAuth initiation (`googleAuth`)
  - Google OAuth callback handler (`googleCallback`)
  - Forgot password endpoint (`forgotPassword`)
  - Logout endpoint (`logout`)
  - Updated `/me` endpoint to return complete profile

- `backend/src/routes/customerAuthRoutes.js` - Updated with:
  - `POST /api/auth/signup` - Customer signup
  - `POST /api/auth/login` - Customer login
  - `POST /api/auth/google` - Initiate Google OAuth
  - `GET /api/auth/google/callback` - Google OAuth callback
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/logout` - Logout user
  - `GET /api/auth/me` - Get current user profile

- `backend/src/server.js` - Added unified `/api/auth` route

### Frontend Changes

#### New Files Created:
- `frontend/src/context/AuthContext.jsx` - Global authentication context
- `frontend/src/components/account/AccountLayout.jsx` - Account area layout
- `frontend/src/components/account/AccountDropdown.jsx` - User dropdown menu
- `frontend/src/components/ProtectedRoute.jsx` - Route protection wrapper
- `frontend/src/pages/ForgotPassword.jsx` - Forgot password page
- `frontend/src/pages/ResetPassword.jsx` - Password reset page
- `frontend/src/pages/AuthCallback.jsx` - Google OAuth callback handler
- `frontend/src/pages/account/Profile.jsx` - User profile page
- `frontend/src/pages/account/Orders.jsx` - Order history page
- `frontend/src/pages/account/Wishlist.jsx` - Wishlist page
- `frontend/src/pages/account/Addresses.jsx` - Address management page

#### Updated Files:
- `frontend/src/main.jsx` - Wrapped app with `AuthProvider`
- `frontend/src/services/customerAuthService.js` - Added all new auth methods
- `frontend/src/pages/CustomerLogin.jsx` - Added Google OAuth button & forgot password link
- `frontend/src/pages/CustomerSignup.jsx` - Added mobile field & Google OAuth button
- `frontend/src/components/Header.jsx` - Integrated account dropdown
- `frontend/src/App.jsx` - Added all new routes and protected routes

---

## Backend Setup

### 1. Install Dependencies (if needed)

The existing dependencies should be sufficient. Verify you have:
```bash
cd backend
npm list @supabase/supabase-js jsonwebtoken express
```

If any are missing:
```bash
npm install @supabase/supabase-js jsonwebtoken express
```

### 2. Check Environment Variables

**IMPORTANT: Routes will fail without environment variables!**

**Before starting the server, verify environment variables are set:**

```bash
cd backend
node check-env.js
```

This will check if all required environment variables are configured. You should see:
- `SUPABASE_URL`: Set
- `SUPABASE_SERVICE_ROLE_KEY`: Set  
- `JWT_SECRET`: Set

**If any are missing:**

1. **Create `backend/.env` file** (see `backend/SETUP_ENV.md` for detailed instructions)
2. **Add required variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret-key
   ```
3. **Get Supabase credentials from:** Supabase Dashboard → Settings → API
4. **Run `node check-env.js` again** to verify

**Quick Setup Guide:** See `backend/SETUP_ENV.md` for step-by-step instructions.

### 3. Verify Backend Routes

Start your backend server:
```bash
cd backend
npm start
```

**Verify server is running:**

**Linux/Mac:**
```bash
curl http://localhost:3000/health
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" | Select-Object -ExpandProperty Content
```

You should see:
```json
{"status":"ok","message":"Server is running"}
```

**Verify auth routes are registered:**

Check that the following endpoints are available:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/google/callback`
- `POST /api/auth/forgot-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

You can also check the root endpoint which lists available routes:
```bash
# Linux/Mac
curl http://localhost:3000/

# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/" | Select-Object -ExpandProperty Content
```

### 3. Verify Routes Are Registered

**Quick verification method:**

1. Start the server:
   ```bash
   cd backend
   npm start
   ```

2. The server should log available routes on startup. Check the console output.

3. Test the root endpoint to see available routes:
   ```bash
   # Linux/Mac
   curl http://localhost:3000/
   
   # Windows PowerShell
   Invoke-WebRequest -Uri "http://localhost:3000/" | ConvertFrom-Json | ConvertTo-Json
   ```

4. **Verify all routes and controllers are properly configured:**
   ```bash
   cd backend
   node verify-routes.js
   ```
   This script will check:
   - All route files have `module.exports`
   - All controller files have `module.exports`
   - All routes are required in `server.js`
   - All routes are mounted with `app.use()`
   
   Fix any errors shown before proceeding.

5. **Common issues if routes are missing:**
   - **Syntax errors**: Check for missing commas, brackets, or semicolons
   - **Missing exports**: All route files must have `module.exports = router;`
   - **Missing controller exports**: All controller functions must be in `module.exports = { ... }`
   - **Function name mismatches**: Route imports must match controller exports exactly
   - **Routes not mounted**: Check `server.js` has `app.use('/api/...', routeName)`
   - **Server not restarted**: Always restart after making changes

6. **If routes still don't work after verification:**
   - Check server console for specific error messages
   - Use the debug endpoint: `GET http://localhost:3000/api/debug/routes`
   - Verify environment variables are set (run `node check-env.js`)
   - Check that all dependencies are installed: `npm install`
   - Server restarted after changes

### 4. Test Auth Endpoints (Optional)

**For Linux/Mac (curl):**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","fullName":"Test User"}'
```

**For Windows (PowerShell):**
```powershell
$body = @{
    email = "test@example.com"
    password = "test123"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Or using Invoke-RestMethod (simpler):**
```powershell
$body = @{
    email = "test@example.com"
    password = "test123"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "mobile": null
  }
}
```

**Debug Route Registration:**

If routes aren't working, first check what routes are actually registered:

```bash
# Linux/Mac
curl http://localhost:3000/api/debug/routes

# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/debug/routes"
```

This will show all registered routes. You should see:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- etc.

**Troubleshooting "Route not found" error:**

If you get a 404 error, check:

1. **Server is running:**
   ```bash
   # Check if server is listening on port 3000
   # Linux/Mac
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```

2. **Route mounting in `backend/src/server.js`:**
   - Should have: `app.use('/api/auth', customerAuthRoutes);`
   - This mounts routes at `/api/auth/*`

3. **Route definition in `backend/src/routes/customerAuthRoutes.js`:**
   - Should have: `router.post('/signup', ...)`
   - Full path becomes: `/api/auth/signup`

4. **Check server logs:**
   - When you make a request, you should see logs like:
     ```
     2024-01-01T12:00:00.000Z - POST /api/auth/signup
     ```

5. **Test with a simple GET request first:**
   ```bash
   # Test health endpoint
   curl http://localhost:3000/health
   
   # If that works, try the auth endpoint
   ```

6. **Verify controller exports:**
   - Check `backend/src/controllers/customerAuthController.js` exports `signup` function
   - Check `backend/src/routes/customerAuthRoutes.js` imports and uses it correctly

---

## 🎨 Frontend Setup

### 1. Install Dependencies (if needed)

Verify React Router is installed:
```bash
cd frontend
npm list react-router-dom
```

If missing:
```bash
npm install react-router-dom
```

### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The app should start on `http://localhost:5173` (or your configured port).

### 3. Verify Routes

Navigate to:
- `/login` - Should show login page with Google button
- `/signup` - Should show signup page with mobile field
- `/forgot-password` - Should show forgot password form

---

## 🔐 Supabase Configuration

### 1. Google OAuth Setup

#### Step 1: Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to enable it
4. You'll need:
   - **Google Client ID** (from Google Cloud Console)
   - **Google Client Secret** (from Google Cloud Console)

#### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     (Find your project URL in Supabase dashboard → Settings → API)

6. Copy the **Client ID** and **Client Secret**

#### Step 3: Add Credentials to Supabase

1. In Supabase Dashboard → Authentication → Providers → Google
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

#### Step 4: Configure Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:5173` (development) or your production URL
- **Redirect URLs**: Add:
  ```
  http://localhost:5173/auth/callback
  http://localhost:3000/api/auth/google/callback
  https://yourdomain.com/auth/callback (production)
  ```

### 2. Email Templates Configuration

#### Password Reset Email

1. Go to **Authentication** → **Email Templates**
2. Find **Reset Password** template
3. Update the redirect URL in the template to:
   ```
   {{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery
   ```

Or use the default Supabase template which should work with your `/reset-password` page.

### 3. Email Settings

1. Go to **Authentication** → **Settings**
2. Ensure **Enable email confirmations** is configured as needed
3. For development, you can disable email confirmations temporarily
4. Configure **SMTP settings** if you want custom email sending (optional)

---

## 🌍 Environment Variables

### Backend Environment Variables

Create or update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Backend URL (for OAuth callbacks)
BACKEND_URL=http://localhost:3000

# Admin Configuration (optional)
ALLOWED_ADMIN_EMAILS=admin@example.com
```

**Important Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API → `service_role` key (keep secret!)
- `FRONTEND_URL` - Your frontend development/production URL
- `BACKEND_URL` - Your backend development/production URL

### Frontend Environment Variables

Create or update `frontend/.env`:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3000
```

For production, update to your production backend URL.

---

## Testing Checklist

### 1. Email/Password Authentication

- [ ] **Signup**
  - Navigate to `/signup`
  - Fill in: Full Name, Email, Password, Mobile (optional)
  - Click "Sign Up"
  - Should redirect to home page
  - Should see account dropdown in header

- [ ] **Login**
  - Navigate to `/login`
  - Enter email and password
  - Click "Login"
  - Should redirect to home page
  - Should see account dropdown in header

- [ ] **Logout**
  - Click account dropdown → Logout
  - Should redirect to home page
  - Account dropdown should be replaced with login icon

### 2. Google OAuth

- [ ] **Initiate Google Login**
  - Navigate to `/login` or `/signup`
  - Click "Continue with Google"
  - Should redirect to Google login page

- [ ] **Complete Google Login**
  - Sign in with Google account
  - Should redirect back to `/auth/callback`
  - Should then redirect to `/account/profile`
  - Should see account dropdown with user info

### 3. Password Reset

- [ ] **Request Password Reset**
  - Navigate to `/forgot-password`
  - Enter email address
  - Click "Send Reset Link"
  - Should show success message
  - Check email inbox for reset link

- [ ] **Reset Password**
  - Click reset link in email
  - Should redirect to `/reset-password`
  - Enter new password and confirm
  - Click "Reset Password"
  - Should redirect to login page

### 4. Account Area

- [ ] **Profile Page** (`/account/profile`)
  - View current profile information
  - Edit name and mobile number
  - Save changes (note: backend update endpoint may need implementation)

- [ ] **Orders Page** (`/account/orders`)
  - View order history
  - See order status, date, and amount

- [ ] **Wishlist Page** (`/account/wishlist`)
  - View saved products
  - Remove items from wishlist

- [ ] **Addresses Page** (`/account/addresses`)
  - Add new address
  - Edit existing address
  - Delete address
  - Set default address

### 5. Protected Routes

- [ ] **Access Protected Route Without Login**
  - Navigate directly to `/account/profile` (without logging in)
  - Should redirect to `/login`

- [ ] **Access Protected Route After Login**
  - Login first
  - Navigate to `/account/profile`
  - Should show profile page

### 6. UI/UX

- [ ] **Account Dropdown**
  - Click user icon in header (when logged in)
  - Should show dropdown menu
  - All menu items should be clickable
  - Logout should work

- [ ] **Responsive Design**
  - Test on mobile devices
  - Account dropdown should work on mobile
  - Account pages should be responsive

---

## Additional Implementation Needed

### 1. Profile Update Endpoint (Backend)

The Profile page currently shows a success message but doesn't actually update the profile. You need to:

**Create endpoint in `backend/src/controllers/customerAuthController.js`:**

```javascript
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, mobile } = req.body;

    const { data: userData, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        full_name: name,
        mobile: mobile || null,
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      id: userData.user.id,
      email: userData.user.email,
      name: name,
      mobile: mobile || null,
      role: userData.user.user_metadata?.role || 'customer',
      created_at: userData.user.created_at
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

**Add route in `backend/src/routes/customerAuthRoutes.js`:**

```javascript
router.put('/me', authenticateToken, updateProfile);
```

**Update `frontend/src/services/customerAuthService.js`:**

```javascript
updateProfile: async (profileData) => {
  const response = await api.put('/auth/me', profileData);
  return response.data;
},
```

**Update `frontend/src/pages/account/Profile.jsx`:**

Replace the comment section with:
```javascript
const updated = await customerAuthService.updateProfile(formData);
updateUser(updated);
```

### 2. Password Reset Implementation

The reset password page needs to actually call Supabase to update the password. You may need to:

1. Create a backend endpoint that accepts the token and new password
2. Use Supabase's `updateUser` method to change the password
3. Or handle it directly on the frontend using Supabase client (if you decide to use it)

**Option: Backend Endpoint (Recommended)**

Add to `customerAuthController.js`:
```javascript
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token and update password
    // This requires Supabase session token handling
    // Implementation depends on your security requirements
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

## 🐛 Troubleshooting

### Quick Route Verification

**First, verify routes are registered:**

1. Start your server:
   ```bash
   cd backend
   npm start
   ```

2. Check registered routes:
   ```bash
   # Linux/Mac
   curl http://localhost:3000/api/debug/routes
   
   # Windows PowerShell  
   Invoke-RestMethod -Uri "http://localhost:3000/api/debug/routes"
   ```

3. You should see routes like:
   ```json
   {
     "routes": [
       "POST /api/auth/signup",
       "POST /api/auth/login",
       "GET /api/auth/me",
       ...
     ]
   }
   ```

4. If routes are missing, check:
   - Server console for errors on startup
   - `backend/src/routes/customerAuthRoutes.js` exports router correctly
   - `backend/src/server.js` mounts routes at `/api/auth`

### Google OAuth Not Working

**Problem**: Clicking "Continue with Google" doesn't redirect or shows error.

**Solutions**:
1. Verify Google OAuth is enabled in Supabase dashboard
2. Check that Client ID and Secret are correct
3. Verify redirect URLs match in both Google Console and Supabase
4. Check browser console for errors
5. Verify `FRONTEND_URL` and `BACKEND_URL` environment variables

### Password Reset Email Not Received

**Problem**: Email not arriving after requesting password reset.

**Solutions**:
1. Check spam folder
2. Verify email is correct in Supabase
3. Check Supabase email logs (Dashboard → Logs → Auth)
4. Verify SMTP settings if using custom email
5. Check that redirect URL in email template is correct

### Protected Routes Redirecting Incorrectly

**Problem**: Users get stuck in redirect loops or wrong pages.

**Solutions**:
1. Verify `AuthContext` is properly wrapping the app
2. Check that `isAuthenticated` logic is correct
3. Verify token is being stored in localStorage
4. Check browser console for authentication errors

### Profile Update Not Working

**Problem**: Profile changes don't save.

**Solutions**:
1. Implement the backend endpoint (see "Additional Implementation Needed")
2. Verify API call is being made (check Network tab)
3. Check backend logs for errors
4. Verify JWT token is being sent in request headers

### Account Dropdown Not Showing

**Problem**: User icon doesn't show dropdown when logged in.

**Solutions**:
1. Verify `AuthContext` is providing user data
2. Check that `isAuthenticated` returns true
3. Verify `AccountDropdown` component is imported correctly
4. Check browser console for React errors

### Internal Server Error (500 Error)

**Problem**: Getting "Internal server error" when calling auth endpoints.

**Most Common Cause**: Missing environment variables.

**Solutions**:

1. **Check environment variables:**
   ```bash
   cd backend
   node check-env.js
   ```
   This will show which variables are missing.

2. **Verify `.env` file exists:**
   ```bash
   # Check if .env file exists
   ls backend/.env  # Linux/Mac
   dir backend\.env  # Windows
   ```

3. **Create/update `.env` file:**
   - Copy `backend/.env.example` to `backend/.env` (if it exists)
   - Or create `backend/.env` with required variables:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     JWT_SECRET=your-secret-key
     ```

4. **Restart server after setting environment variables:**
   - Stop server (Ctrl+C)
   - Start again: `npm start`

5. **Check server console logs:**
   - The error handler now logs the full error and stack trace
   - Look for the actual error message in the console
   - Common errors:
     - "Missing Supabase environment variables"
     - "Invalid Supabase URL"
     - "JWT_SECRET is not defined"

6. **Verify Supabase credentials:**
   - Get `SUPABASE_URL` from: Supabase Dashboard → Settings → API → Project URL
   - Get `SUPABASE_SERVICE_ROLE_KEY` from: Supabase Dashboard → Settings → API → `service_role` key (keep secret!)

### Route Not Found (404 Error)

**Problem**: Getting "Route not found" when calling `/api/auth/signup` or other auth endpoints.

**Solutions**:

1. **Verify route mounting order:**
   - Check `backend/src/server.js` line 31: `app.use('/api/auth', customerAuthRoutes);`
   - This should be BEFORE the 404 handler (line 68)

2. **Check route file exports:**
   ```javascript
   // backend/src/routes/customerAuthRoutes.js
   // Should export router at the end:
   module.exports = router;
   ```

3. **Verify controller exports:**
   ```javascript
   // backend/src/controllers/customerAuthController.js
   // Should export signup function:
   module.exports = { signup, login, getProfile, ... };
   ```

4. **Test route directly:**
   ```bash
   # Start server and check logs
   cd backend
   npm start
   
   # In another terminal, test the route
   # The server logs should show: "POST /api/auth/signup"
   ```

5. **Check for route conflicts:**
   - Make sure `/api/auth` isn't being overridden by another route
   - The order in `server.js` matters - more specific routes should come first

6. **Verify server restart:**
   - After making route changes, restart the server
   - Stop server (Ctrl+C) and start again: `npm start`

7. **Check for syntax errors:**
   ```bash
   cd backend
   node src/server.js
   # Should start without errors
   ```

8. **Use the debug endpoint to see registered routes:**
   ```bash
   # Linux/Mac
   curl http://localhost:3000/api/debug/routes
   
   # Windows PowerShell
   Invoke-RestMethod -Uri "http://localhost:3000/api/debug/routes"
   ```
   This will show all registered routes. Look for `/api/auth/signup`, `/api/auth/login`, etc.

9. **Verify route file loads correctly:**
   ```bash
   # Test if the routes file can be loaded
   cd backend/src/routes
   node -e "try { const routes = require('./customerAuthRoutes.js'); console.log('Routes loaded:', typeof routes); } catch(e) { console.error('Error:', e.message); }"
   ```

10. **Check server logs when making requests:**
    - When you POST to `/api/auth/signup`, check the server console
    - You should see: `POST /api/auth/signup` logged
    - If you don't see this log, the route isn't being hit (check URL/method)
    - If you see the log but get 404, the route handler isn't working

11. **Common issues:**
    - **Server not restarted**: After changing routes, always restart the server completely
    - **Wrong HTTP method**: Make sure you're using `POST` not `GET` for signup/login
    - **Missing Content-Type header**: Ensure `Content-Type: application/json` is set
    - **Route conflict**: Check if another route is matching first (order matters in Express)
    - **Environment variables missing**: Routes should still register, but will fail when called

---

## 📝 Notes

1. **Security**: 
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
   - Use environment variables for all sensitive data
   - In production, use HTTPS for all OAuth redirects

2. **Development vs Production**:
   - Update `FRONTEND_URL` and `BACKEND_URL` for production
   - Update Supabase redirect URLs for production domain
   - Use strong `JWT_SECRET` in production

3. **Database**:
   - User data is stored in Supabase `auth.users` table
   - User metadata (name, mobile, role) is in `user_metadata` JSON field
   - No separate users table needed (using Supabase Auth)

4. **Mobile Field**:
   - Mobile is optional in signup
   - Stored in `user_metadata.mobile`
   - Can be updated via profile page

5. **Google OAuth First Login**:
   - On first Google login, user is automatically assigned `role: 'customer'`
   - Name is extracted from Google profile or email

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables with production URLs
- [ ] Configure production Supabase redirect URLs
- [ ] Set strong `JWT_SECRET` (use crypto.randomBytes)
- [ ] Enable HTTPS for all domains
- [ ] Update Google OAuth redirect URIs in Google Console
- [ ] Test all authentication flows in production environment
- [ ] Configure production email templates
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Review and test security measures
- [ ] Update CORS settings if needed

---

## 📞 Support

If you encounter issues:

1. Check browser console for frontend errors
2. Check backend server logs for API errors
3. Review Supabase dashboard logs (Authentication → Logs)
4. Verify all environment variables are set correctly
5. Test API endpoints directly using curl or Postman

---

**Last Updated**: After authentication system implementation
**Version**: 1.0.0
