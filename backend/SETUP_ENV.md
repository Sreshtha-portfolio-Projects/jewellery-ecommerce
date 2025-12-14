# Environment Variables Setup Guide

## Quick Fix for "Missing Supabase environment variables"

The routes are failing because the Supabase environment variables are not set. Follow these steps:

### Step 1: Create .env file

Create a file named `.env` in the `backend` directory:

```bash
cd backend
# On Windows PowerShell
New-Item -Path .env -ItemType File

# On Linux/Mac
touch .env
```

### Step 2: Add Required Variables

Open `backend/.env` and add the following:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-change-in-production

# Server Configuration (optional)
PORT=3000
NODE_ENV=development

# Frontend/Backend URLs (optional, for OAuth)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### Step 3: Get Supabase Credentials

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (or create one if you don't have one)
3. **Go to Settings → API**
4. **Copy the following:**
   - **Project URL** → This is your `SUPABASE_URL`
     - Example: `https://abcdefghijklmnop.supabase.co`
   - **service_role key** → This is your `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ **Keep this secret!** Never commit it to git
     - It's the long key under "Project API keys" → "service_role" (not "anon")

### Step 4: Generate JWT Secret

For development, you can use any random string. For production, use a strong secret:

```bash
# Generate a random secret (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 5: Verify Setup

Run the environment check:

```bash
cd backend
node check-env.js
```

You should see:
```
✅ SUPABASE_URL: https://...
✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGc...
✅ JWT_SECRET: your-secret...
```

### Step 6: Verify Routes

After setting up .env, run:

```bash
node verify-routes.js
```

All routes should now show as properly exported.

### Step 7: Start Server

```bash
npm start
```

The server should start without errors, and all routes should be available.

---

## Troubleshooting

### "Missing Supabase environment variables" error

**Cause**: `.env` file doesn't exist or variables are not set.

**Fix**:
1. Check that `.env` file exists in `backend/` directory
2. Verify variables are set (run `node check-env.js`)
3. Make sure there are no spaces around `=` in `.env` file
4. Don't use quotes around values in `.env` (unless the value itself contains spaces)

### Routes still not working after setting .env

1. **Restart the server** - Environment variables are loaded on startup
2. **Check .env file location** - Must be in `backend/` directory
3. **Check for typos** - Variable names are case-sensitive
4. **Verify Supabase credentials** - Make sure URL and key are correct

### .env file not being loaded

- Make sure file is named exactly `.env` (not `.env.txt` or `env`)
- Make sure file is in the `backend/` directory (same level as `package.json`)
- Check that `require('dotenv').config()` is called in `server.js` (it should be at the top)

---

## Security Notes

⚠️ **IMPORTANT**:

1. **Never commit `.env` to git** - It contains secrets
2. **Add `.env` to `.gitignore`**:
   ```bash
   echo ".env" >> .gitignore
   ```
3. **Use different secrets for production** - Don't use development secrets in production
4. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - It has admin access to your database

---

## Example .env file

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.example
JWT_SECRET=my-super-secret-jwt-key-change-in-production

# Server
PORT=3000
NODE_ENV=development

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

Replace the example values with your actual Supabase credentials!
