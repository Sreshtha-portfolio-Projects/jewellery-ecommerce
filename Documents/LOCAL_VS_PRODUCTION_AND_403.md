# Local vs Production & 403 Troubleshooting

Single guide for environment setup and fixing 403 "Invalid or expired token" errors when switching between localhost and production.

---

## Why 403 Happens

- Tokens created on **production** (Vercel) are signed with production `JWT_SECRET`.
- Your **local** backend uses a different `JWT_SECRET`.
- Production token cannot be verified by local backend → **403 error**.

Same applies in reverse: local tokens fail on production if secrets don’t match.

```
┌─────────────────┐         ┌──────────────────┐
│  Production     │         │  Localhost      │
│  (Vercel)       │         │  (localhost:3000)│
├─────────────────┤         ├──────────────────┤
│ JWT_SECRET:     │         │ JWT_SECRET:     │
│ "prod-secret"   │  ≠      │ "local-secret"  │
└─────────────────┘         └──────────────────┘
        │                            │
        ▼                            ▼
   Token signed with          Verification expects
   "prod-secret"              "local-secret" → ❌ 403
```

Other possible causes: token not yet in localStorage when the request runs (timing), or wrong Authorization header format.

---

## Quick Fix (30 seconds)

### Option 1: Clear tokens and re-login locally

1. Open browser console (F12).
2. Run: `localStorage.clear();`
3. Refresh the page.
4. Log in again on localhost.
5. You now have a token signed with your local `JWT_SECRET`.

### Option 2: Use production backend from local frontend

1. Create `frontend/.env.local`:
   ```env
   VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com
   ```
2. Restart frontend: `cd frontend && npm run dev`
3. Local UI will call production API (use production login).

---

## Recommended Setup

### Local development

- **Frontend** `frontend/.env.local`: `VITE_API_BASE_URL=http://localhost:3000`
- **Backend** `backend/.env`: `JWT_SECRET=your-local-secret`
- Run backend on port 3000, frontend on 5173. Log in on localhost so all calls use the local backend.

### Production (Vercel + Render)

- **Vercel** env: `VITE_API_BASE_URL=https://jewellery-ecommerce-9xs1.onrender.com`
- **Render** env: `JWT_SECRET` set and consistent with what production frontend expects.
- Deploy frontend to Vercel; it will use the Render backend.

### .gitignore

- Add `frontend/.env.local` to `.gitignore` (usual default).
- Do **not** add `.env.production` to `.gitignore` if Vercel needs it.

---

## Vercel environment variables

1. Vercel Dashboard → your project → **Settings** → **Environment Variables**.
2. Add `VITE_API_BASE_URL` = `https://jewellery-ecommerce-9xs1.onrender.com`.
3. Enable for Production, Preview, and Development as needed.
4. Save and redeploy.

---

## Code fixes already in place

- **AuthContext.jsx**: Short delay after storing token; fallback to login response if profile fetch fails.
- **auth.js (backend)**: Better JWT verification error logging; extra details in development.

If `/api/auth/me` still returns 403 after login, the usual cause is `JWT_SECRET` mismatch (see below).

---

## Verification

### Check JWT_SECRET (Render / local)

1. Render Dashboard → your backend service → **Environment**.
2. Ensure `JWT_SECRET` is set and matches the secret used where the token was created.
3. Generate a new secret if needed:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
4. Use the same value in local `backend/.env` and Render when testing the same environment.

### Check token storage

1. After login, DevTools → Application → Local Storage.
2. Confirm `customerToken` (or your token key) is present.

### Test token manually

```bash
curl -X GET https://jewellery-ecommerce-9xs1.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Still 403 on localhost | Clear localStorage, set `JWT_SECRET` in `backend/.env`, restart backend, log in again on localhost. |
| Production tokens work, local don’t | Local `JWT_SECRET` may be wrong. Check `backend/.env`; regenerate and set the same secret for local. |
| Vercel still using localhost API | Set `VITE_API_BASE_URL` in Vercel env vars, redeploy, check build logs. |
| Login succeeds but profile fails | Code falls back to login response; fix `JWT_SECRET` so `/api/auth/me` works. |

---

## Prevention

- Use the same `JWT_SECRET` per environment (all local backends share one; production has its own).
- Keep secrets in env vars only; never in code.
- When switching environments: clear localStorage, or use separate browser profiles (e.g. one for local, one for production).

The app can auto-detect localhost and use the local backend when `VITE_API_BASE_URL` is not set; setting it explicitly is still recommended for clarity.

---

## Checklist

**Local**

- [ ] Frontend on `http://localhost:5173`, backend on `http://localhost:3000`
- [ ] `frontend/.env.local`: `VITE_API_BASE_URL=http://localhost:3000`
- [ ] `backend/.env`: `JWT_SECRET` set
- [ ] Login and protected routes work, no 403

**Production**

- [ ] Vercel env: `VITE_API_BASE_URL` = Render backend URL
- [ ] Render: `JWT_SECRET` set
- [ ] Login and protected routes work on deployed site
