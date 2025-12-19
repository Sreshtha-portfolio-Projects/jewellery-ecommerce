# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)

## Step 1: Supabase Setup (5 minutes)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Wait for it to initialize (2-3 minutes)

2. **Set Up Database**
   - In Supabase Dashboard, go to SQL Editor
   - Copy and paste the entire contents of `supabase-setup.sql`
   - Click "Run" to execute
   - You should see "Success. No rows returned"

3. **Get Your Credentials**
   - Go to Settings > API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - Service Role Key (the `service_role` key, NOT the `anon` key)

4. **Create Admin User**
   - Go to Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter email and password (remember these!)
   - Click "Create user"

## Step 2: Backend Setup (2 minutes)

```bash
cd backend
npm install
```

Create `.env` file:
```bash
# Copy the example
cp .env.example .env
```

Edit `.env` and add:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-random-secret-key-here-make-it-long-and-random
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Start backend:
```bash
npm run dev
```

You should see: `Server is running on port 3000`

## Step 3: Frontend Setup (2 minutes)

Open a NEW terminal window:

```bash
cd frontend
npm install
```

Create `.env` file:
```bash
# Copy the example
cp .env.example .env
```

Edit `.env` and add:
```
VITE_API_BASE_URL=http://localhost:3000
```

Start frontend:
```bash
npm run dev
```

You should see: `Local: http://localhost:5173`

## Step 4: Test It Out!

1. **Visit Homepage**: http://localhost:5173
   - You should see the luxury jewelry homepage

2. **Test Admin Login**: http://localhost:5173/admin/login
   - Use the email/password you created in Supabase
   - You should be redirected to the dashboard

3. **Check Dashboard**: http://localhost:5173/admin/dashboard
   - Should show "Admin Authenticated" status
   - Should show "API Connection Status: ok" status

## Troubleshooting

### Backend won't start
- Check that `.env` file exists and has all variables
- Make sure port 3000 is not in use
- Verify Supabase credentials are correct

### Frontend can't connect to backend
- Make sure backend is running on port 3000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for CORS errors

### Login fails
- Verify the user exists in Supabase Authentication
- Check backend console for error messages
- Make sure you're using the correct email/password

### No products showing
- Check that `supabase-setup.sql` ran successfully
- Verify products exist in Supabase Table Editor
- Check backend console for database errors

## Next Steps

- Customize products in Supabase
- Add your own images (update `image_url` in products table)
- Customize colors and styling in `frontend/tailwind.config.js`
- Add more products through Supabase dashboard

## Need Help?

Check the main `README.md` for detailed documentation.

