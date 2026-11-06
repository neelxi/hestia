# Deploy Hestia for Clients (Scenario B)

A step-by-step guide for **you** (the deployer) to set up Hestia for another person or company. You handle Supabase, migrations, workspace bootstrap, and portal deployment. They use the portal and optionally configure Claude Desktop.

---

## Overview

| You do | They do |
|--------|---------|
| Create Supabase project | Sign up at portal URL |
| Apply migrations | Configure Claude Desktop (optional) |
| Bootstrap their workspace | Confirm email if required |
| Deploy portal to Vercel/Railway | |

---

## Phase 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it (e.g. "ClientName Hestia" or "Hestia Production")
3. Set a database password (save it securely)
4. Choose region closest to the client

### 1.2 Get Credentials

Project Settings → API:

| Setting | Use for |
|---------|---------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` (keep secret) |

### 1.3 Apply Migrations

**Option A: Supabase CLI**
```bash
cd /path/to/hestia
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

**Option B: Manual SQL**
1. Supabase Dashboard → SQL Editor
2. Run each file in `supabase/migrations/` in order: 001, 002, 003, 004, 005
3. Copy contents, execute, repeat for each file

---

## Phase 2: Environment & Workspace Bootstrap

### 2.1 Create `.env` (on your machine)

```bash
cd /path/to/hestia
cp .env.example .env
```

Edit `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2.2 Bootstrap Their Workspace

```bash
./scripts/setup_new_business.sh "Their Company Name" template_id
```

**Template choices:**
- `brokerage` — Real estate brokerages
- `professional-services` — RIAs, consultancies
- `agency` — Creative/marketing agencies
- `base` — Generic

**Example:**
```bash
./scripts/setup_new_business.sh "Acme Realty" brokerage
```

### 2.3 Save the Output

The script prints JSON. Capture the `workspace_id` if needed. Example output:

```json
{
  "workspace_id": "...",
  "workspace_name": "Acme Realty",
  "template_id": "brokerage",
  "directives_seeded": 4,
  "next_steps": ["Sign up the first user at the portal (first user becomes admin)", ...]
}
```

---

## Phase 3: Deploy the Portal

### 3.1 Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your repo (or push to GitHub first)
3. **Root Directory:** Set to `portal` in project settings (so Vercel builds the Next.js app from that folder)
4. **Framework Preset:** Next.js (auto-detected)
5. **Environment Variables** — Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
6. Deploy
7. (Optional) Add custom domain: Settings → Domains → e.g. `portal.acmerealty.com`

### 3.2 Railway

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub (or CLI)
3. Set **Root Directory** to `portal`
4. Add environment variables (same as Vercel)
5. Railway assigns a URL; add custom domain if desired

### 3.3 Verify

- Visit the deployed URL
- You should see the Hestia sign-in page (or home with Sign in / Create account)

---

## Phase 4: Configure Supabase Auth (Optional but Recommended)

For a smooth client experience:

1. Supabase Dashboard → Authentication → Providers → Email
2. **Confirm email:** Consider disabling for initial onboarding (clients can sign up and use immediately)
3. **Site URL:** Set to your portal URL (e.g. `https://portal.acmerealty.com`)
4. **Redirect URLs:** Add your portal URL and `https://your-portal.vercel.app/**` (or Railway URL)

---

## Phase 5: Hand Off to the Client

### 5.1 Send Them

| Item | Value |
|------|-------|
| **Portal URL** | `https://your-portal.vercel.app` or your custom domain |

### 5.2 Instructions for Them

> **Getting started with Hestia**
>
> 1. Go to [portal URL]
> 2. Click **Create account**
> 3. Enter your display name, email, and password
> 4. Check your email to confirm (if required)
> 5. Sign in and you’ll see your team dashboard
>
> **Optional — Claude AI assistant:** If you want to use Claude with your data, follow the setup in [link to CLAUDE_MCP_SETUP.md or a short MCP handout].

### 5.3 MCP Handoff (If They Want Claude)

**Option A: They run MCP locally**
- Send them the repo (or a zip) and `docs/CLAUDE_MCP_SETUP.md`
- They need: Supabase URL and **service role key** (you must trust them with it)
- They run the MCP server on their machine and connect Claude Desktop to it

**Option B: Portal only**
- They use the portal for dashboards, clients, tasks, etc.
- No Claude MCP — simpler, no key sharing

**Option C: You host MCP** (advanced)
- Run the MCP server on your infrastructure
- Expose it (e.g. via stdio bridge or HTTP MCP)
- They connect Claude to your MCP endpoint — they never see the service role key

---

## Phase 6: Adding More Clients (Single-Tenant)

Each client gets their own Supabase project. To add another client:

1. Create a new Supabase project for them
2. Apply migrations and run `./scripts/setup_new_business.sh "Client Name" template`
3. Deploy a portal (or share your portal URL if you host one per client)
4. They sign up at the portal (first user becomes admin)

---

## Checklist: Deploy for One Client

- [ ] Create Supabase project
- [ ] Apply migrations (001–005)
- [ ] Create `.env` with Supabase credentials
- [ ] Run `./scripts/setup_new_business.sh "Client Name" template`
- [ ] Deploy portal (Vercel or Railway)
- [ ] Set portal env vars
- [ ] Configure Supabase Auth (site URL, redirect URLs)
- [ ] Send client: portal URL
- [ ] (Optional) Send MCP setup instructions if they want Claude

---

## Troubleshooting

**"Failed to create workspace"**
- Migrations not applied — run `npx supabase db push` or apply SQL manually
- Check `.env` has correct Supabase credentials

**Portal shows auth errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel/Railway
- Check Supabase Auth → URL Configuration (site URL, redirect URLs)

**Client can't sign up**
- Email confirmation may be required — they must click the link in the email
- Or disable "Confirm email" in Supabase Auth for faster onboarding
