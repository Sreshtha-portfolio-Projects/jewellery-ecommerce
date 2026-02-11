# Backend Environment Variables

For full setup (Supabase, JWT, first-time configuration), see **Documents/SETUP.md**.

This file is a quick reference. Create `backend/.env` with:

- **SUPABASE_URL** – From Supabase Dashboard → Settings → API (Project URL)
- **SUPABASE_SERVICE_ROLE_KEY** – Use the **service_role** key (not anon)
- **JWT_SECRET** – At least 32 characters; e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **PORT** (optional) – Default 3000
- **NODE_ENV** (optional) – development | production

Never commit `.env` to git. Add `.env` to `.gitignore`.
