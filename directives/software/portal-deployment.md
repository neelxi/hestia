# Portal Deployment (portal.hestiaops.com)

## Goal

Deploy the Hestia Next.js portal to **portal.hestiaops.com** so it runs in production instead of localhost.

## Inputs

- Repo with `portal/` (Next.js app)
- Supabase project (migrations applied, workspace bootstrapped)
- `.env` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Tools / Scripts

- **Vercel:** Primary deployment platform (see `docs/PORTAL_DEPLOYMENT.md`)
- **Railway:** Alternative
- No custom execution scripts — use Vercel/Railway dashboards or CLI

## Outputs

- Portal live at https://portal.hestiaops.com
- Marketing apply form at hestiaops.com submits to portal API
- Supabase Auth configured with portal URL

## Steps (Vercel)

1. Create new Vercel project, import repo
2. Set **Root Directory** to `portal`
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy
5. Add domain `portal.hestiaops.com` in Vercel → Domains
6. Add CNAME at registrar: `portal` → `cname.vercel-dns.com`
7. Supabase Auth → URL Configuration: Site URL = `https://portal.hestiaops.com`, Redirect URLs include `https://portal.hestiaops.com/**`

## Edge Cases

- **Apply form cross-origin:** Form on hestiaops.com POSTs to portal.hestiaops.com/api/apply. Redirect URL `_next` must be to hestiaops.com/thankyou.html. API validates redirect against allowed origins.
- **Local dev:** Marketing site and portal on different ports — form action is hardcoded to portal.hestiaops.com for production. For local testing, temporarily change form action to `http://localhost:3000/api/apply` if portal runs on 3000.
- **Preview deploys:** Add Vercel preview URL to Supabase Redirect URLs if testing PR previews.
