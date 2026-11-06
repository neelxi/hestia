# Deploy the Portal to portal.hestiaops.com

This guide walks you through deploying the Hestia portal (Next.js app) to **portal.hestiaops.com**, moving from localhost to production.

---

## What You're Deploying

The portal is a **Next.js 16** app with:
- Team dashboard, clients, tasks, applications, metrics
- Admin settings, users, templates
- Client portal (linked by email)
- Auth (Supabase)
- API routes (e.g. `/api/apply` for marketing form submissions)

---

## Prerequisites

- [ ] Supabase project set up with migrations applied
- [ ] Workspace bootstrapped (`./scripts/setup_new_business.sh "Hestia" hestia`)
- [ ] `.env` in repo root with Supabase credentials

---

## Option A: Vercel (Recommended)

### 1. Create a new Vercel project for the portal

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your `hestia` repository
3. Configure:
   - **Project Name:** `portal` or `hestia-portal`
   - **Root Directory:** `portal` (critical — so Vercel builds the Next.js app)
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### 2. Environment variables

In **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role key (keep secret) |

Apply to **Production**, **Preview**, and **Development**.

### 3. Deploy

Click **Deploy**. Vercel will build and deploy. You'll get a URL like `portal-xxx.vercel.app`.

### 4. Add custom domain portal.hestiaops.com

1. **Settings** → **Domains** → **Add**
2. Enter `portal.hestiaops.com`
3. Vercel will show DNS instructions

### 5. DNS configuration

At your domain registrar (where hestiaops.com is managed):

**Add a CNAME record:**
- **Name/Host:** `portal`
- **Value/Target:** `cname.vercel-dns.com`

Or if using **Vercel DNS** for hestiaops.com:
- The domain may already be connected; add `portal` as a subdomain in Vercel.

DNS propagation: usually 5–60 minutes.

---

## Option B: Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub** → select `hestia`
3. Set **Root Directory** to `portal`
4. Add the same environment variables as above
5. **Settings** → **Domains** → Add `portal.hestiaops.com`
6. Add CNAME at registrar: `portal` → your Railway URL

---

## Supabase Auth configuration

After the portal is live:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL:** `https://portal.hestiaops.com`
3. **Redirect URLs:** Add:
   - `https://portal.hestiaops.com/**`
   - `https://portal-xxx.vercel.app/**` (if using Vercel, for preview deploys)

---

## Marketing site integration

The apply form on **hestiaops.com** submits to the portal API:

- **Form action:** `https://portal.hestiaops.com/api/apply`
- **Redirect after submit:** `https://hestiaops.com/thankyou.html` (set via `_next` in form)

If you operate a separate marketing site, point its application form at `https://portal.hestiaops.com/api/apply` and keep the redirect origin allowlist in sync.

---

## Verify deployment

1. **Portal:** https://portal.hestiaops.com — sign-in page
2. **Sign up:** Create account (first user becomes admin)
3. **Apply form:** Submit at hestiaops.com/apply — should save to Supabase and redirect to thank you page

---

## Quick reference: Vercel CLI

```bash
cd portal
npx vercel --prod
# Follow prompts; set Root Directory to portal if asked
# Add portal.hestiaops.com in Vercel dashboard → Domains
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check Root Directory is `portal` |
| Auth redirect errors | Add portal URL to Supabase Redirect URLs |
| Apply form doesn't submit | Verify form action is `https://portal.hestiaops.com/api/apply` |
| Blank page | Check env vars; clear cookies |
