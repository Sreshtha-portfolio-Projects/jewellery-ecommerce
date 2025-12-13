# Setup Guide - Poor Gem E-commerce Platform

This guide will walk you through setting up the entire platform from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)
- **Supabase Account** (free tier works) - [Sign up](https://supabase.com)

Verify installations:
```bash
node --version  # Should be v18+
npm --version
```

## 🗄️ Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/sign up
2. Click **"New Project"**
3. Fill in:
   - **Name**: `poor-gem` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### 1.2 Set Up Database Schema

1. In Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-setup.sql` from this project
4. Copy **ALL** the contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: **"Success. No rows returned"**

This creates:
- `products` table
- Indexes for performance
- Row Level Security policies
- 12 sample products

### 1.3 Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. You'll need two values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Service Role Key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **Important**: Use the `service_role` key (not `anon` key)
   - It's the secret key that bypasses RLS
   - Keep it secure - never commit to git!

### 1.4 Create Admin User

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@poorgem.com` (or your email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create user"**
5. **Save these credentials** - you'll need them to log in!

## 🔧 Step 2: Backend Setup

### 2.1 Install Dependencies

Open terminal in the project root:

```bash
cd backend
npm install
```

This installs:
- Express.js
- Supabase client
- JWT
- CORS
- dotenv
- nodemon (dev dependency)

### 2.2 Configure Environment Variables

1. Create `.env` file in the `backend` folder:

```bash
# Windows PowerShell
cd backend
Copy-Item .env.example .env

# Or manually create .env file
```

2. Open `backend/.env` and fill in:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret - CHANGE THIS!
# Generate a random string (at least 32 characters)
# You can use: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Supabase Configuration
# Paste from Step 1.3
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Generate JWT Secret:**
```bash
# On Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use an online generator
# Or just use a long random string
```

### 2.3 Test Backend

Start the development server:

```bash
npm run dev
```

You should see:
```
Server is running on port 3000
Environment: development
```

**Test the API:**
- Open browser: http://localhost:3000/health
- Should see: `{"status":"ok","message":"Server is running"}`

✅ Backend is working!

**Stop the server:** Press `Ctrl+C`

## 🎨 Step 3: Frontend Setup

### 3.1 Install Dependencies

Open a **NEW terminal window** (keep backend running in first terminal):

```bash
cd frontend
npm install
```

This installs:
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### 3.2 Configure Environment Variables

1. Create `.env` file in the `frontend` folder:

```bash
# Windows PowerShell
cd frontend
Copy-Item .env.example .env

# Or manually create .env file
```

2. Open `frontend/.env` and add:

```env
# API Base URL - points to your backend
VITE_API_BASE_URL=http://localhost:3000
```

### 3.3 Test Frontend

Start the development server:

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ Frontend is working!

**Open in browser:** http://localhost:5173

## 🧪 Step 4: Verify Everything Works

### 4.1 Test Homepage

1. Visit: http://localhost:5173
2. You should see:
   - Luxury jewelry homepage
   - Hero section
   - Product categories
   - Bestseller products (may be empty if API not connected)

### 4.2 Test API Connection

1. Make sure **backend is running** (Step 2.3)
2. Refresh the homepage
3. Products should now appear in the Bestseller section

### 4.3 Test Admin Login

1. Visit: http://localhost:5173/admin/login
2. Enter credentials from Step 1.4:
   - Email: `admin@poorgem.com` (or your email)
   - Password: (your password)
3. Click **"Login"**
4. You should be redirected to: http://localhost:5173/admin/dashboard

### 4.4 Verify Admin Dashboard

On the dashboard, you should see:
- ✅ **Admin Authenticated** (green checkmark)
- ✅ **API Connection Status: ok** (green checkmark)
- ✅ Timestamp showing last health check

## 🐛 Troubleshooting

### Backend Issues

**Port 3000 already in use:**
```bash
# Change PORT in backend/.env to another port (e.g., 3001)
# Update frontend/.env VITE_API_BASE_URL accordingly
```

**Supabase connection error:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Make sure you're using the **service_role** key, not anon key
- Check Supabase project is active (not paused)

**JWT errors:**
- Make sure `JWT_SECRET` is set in `.env`
- Should be at least 32 characters long

### Frontend Issues

**Can't connect to backend:**
- Verify backend is running on port 3000
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Open browser console (F12) and check for CORS errors
- Make sure backend CORS is enabled (it is by default)

**No products showing:**
- Check backend console for errors
- Verify `supabase-setup.sql` ran successfully
- Check Supabase Table Editor → `products` table has data
- Test API directly: http://localhost:3000/api/products

**Login fails:**
- Verify user exists in Supabase Authentication → Users
- Check backend console for error messages
- Verify email/password are correct
- Make sure user is confirmed (Auto Confirm was checked)

**Tailwind styles not working:**
- Make sure `postcss.config.js` exists
- Verify `tailwind.config.js` exists
- Check `index.css` has `@tailwind` directives
- Restart the dev server

### Database Issues

**Products table doesn't exist:**
- Re-run `supabase-setup.sql` in SQL Editor
- Check for any error messages

**RLS blocking queries:**
- Backend uses service_role key, so RLS is bypassed
- If issues persist, check RLS policies in Supabase Dashboard

## 📝 Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

- **Frontend changes**: Auto-reloads (Hot Module Replacement)
- **Backend changes**: Auto-restarts (nodemon)
- **Database changes**: Run SQL in Supabase SQL Editor

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
cd backend
npm start
# Uses node (not nodemon)
```

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable HTTPS
- [ ] Review Supabase RLS policies
- [ ] Set up proper CORS origins
- [ ] Use Supabase project secrets (not service role key in production if possible)
- [ ] Enable Supabase project backups

## 📚 Next Steps

Once setup is complete:

1. **Customize Products:**
   - Go to Supabase Dashboard → Table Editor → `products`
   - Edit existing products or add new ones
   - Update `image_url` with your own images

2. **Customize Branding:**
   - Edit `frontend/tailwind.config.js` for colors
   - Update `frontend/src/components/Header.jsx` for logo
   - Modify `frontend/index.html` for meta tags

3. **Add More Features:**
   - See `README.md` for architecture details
   - Check `PROJECT_SUMMARY.md` for what's built
   - Extend with product CRUD, orders, etc.

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review `QUICKSTART.md` for condensed setup
- Check browser console (F12) for frontend errors
- Check backend terminal for server errors
- Review Supabase logs in Dashboard

## ✅ Setup Complete!

If you've reached here and everything works:
- ✅ Homepage loads with products
- ✅ Admin login works
- ✅ Dashboard shows API connection
- ✅ No console errors

**Congratulations!** Your luxury jewelry e-commerce platform is ready! 🎉



2KquJzaVkEFNMvGAQ6hZbYj34wefgUnH
