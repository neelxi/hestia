# Portal Setup Guide

This guide walks you through setting up the Hestia portal — the web application where your team and clients access data, manage tasks, and run workflows. It follows the RIA AI Operations Blueprint and Brokerage AI Operations Blueprint: one branded app with role-based views for team, admin, and clients.

---

## What the Portal Provides

| View | Who | Key Pages |
|------|-----|-----------|
| **Team** | Advisors, ops staff | Dashboard, Clients, Projects, Tasks, Directives, Activity, Metrics, Capacity |
| **Admin** | Principals, office managers | Settings, Users, Templates, Integrations |
| **Client** | Clients (linked by email) | Dashboard, Accounts, Projects, Documents, Meetings |

The portal connects to the same Supabase database as your MCP server. Role-based routing ensures each user sees the right view.

---

## Prerequisites

Before starting, ensure you have:

1. **Supabase set up** — Database running with migrations applied
2. **Company bootstrapped** — Run `./scripts/setup_new_business.sh "Your Company" professional-services` (or `brokerage` for brokerages)
3. **`.env` in repo root** — With `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Quick Start

### 1. Install dependencies

```bash
cd portal
npm install
```

### 2. Configure environment

The portal reads from `portal/.env.local`. From the repo root:

```bash
./portal/scripts/setup-env.sh
```

This copies Supabase vars from `.env` to `portal/.env.local`. Or create it manually with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the development server

```bash
npm run dev
```

The portal runs at **http://localhost:3000**.

### 4. Create your first user

1. Go to **http://localhost:3000/signup**
2. Enter your display name, email, and password
3. Click **Create account**

The first user becomes admin. Subsequent users become team members by default.

---

## First Login Flow

After signup:

- **Team members** → `/team/dashboard` (clients count, projects, tasks, activity)
- **Admins** → `/admin/settings` (firm settings, users, templates)
- **Clients** → `/client/dashboard` (requires your email to be linked to a `clients` record)

---

## Blueprint Alignment

### RIA AI Operations Blueprint (Chapter 5)

| Blueprint Step | Hestia Implementation |
|----------------|------------------------|
| Next.js + Tailwind + Shadcn | ✅ Portal uses Next.js 16, Tailwind 4, Radix UI |
| Role-based routing (client vs team) | ✅ `/client/*` and `/team/*` and `/admin/*` |
| Supabase auth | ✅ Login, signup, session handling |
| Client dashboard (portfolio, meetings, activity) | ✅ `/client/dashboard`, `/client/accounts`, `/client/projects`, `/client/documents`, `/client/meetings` |
| Team dashboard (clients, tasks, metrics) | ✅ `/team/dashboard`, `/team/clients`, `/team/tasks`, `/team/metrics`, `/team/directives` |
| Branding (logo, colors) | ⏳ Workspace `settings` in DB; UI can be extended to read them |

### Brokerage AI Operations Blueprint

| Blueprint Step | Hestia Implementation |
|----------------|------------------------|
| Agent dashboard (production, pipeline) | ✅ `/team/dashboard` + `/team/metrics`; extend with brokerage-specific widgets |
| Admin dashboard (transactions, commission queue) | ✅ `/admin/*`; add transaction/commission pages as needed |
| Role-based views | ✅ Same routing; templates (`brokerage`, `professional-services`) customize terminology |

---

## Portal Structure

```
portal/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, signup
│   │   ├── (team)/           # Team dashboard, clients, tasks, directives, etc.
│   │   ├── (admin)/          # Admin settings, users, templates, integrations
│   │   ├── (client)/         # Client dashboard, accounts, documents, meetings
│   │   └── api/              # Webhooks, agent trigger
│   ├── components/
│   ├── lib/                  # Supabase client, auth helpers, middleware
│   └── types/
```

---

## Enabling Client Access

Clients see their dashboard only if their **email** matches a row in the `clients` table. To enable client portal access:

1. Create a client in the portal (Team → Clients) or via MCP `create_client`
2. Set the client's `email` to the user's signup email
3. Ensure the user's profile has `role = 'client'` (or link client to auth via your invite flow)

For a full client invite flow, you'd add: invite by email → signup with that email → profile gets `role: client` and is linked to the `clients` record.

---

## Adding Branding

Per the blueprints, store branding in your workspace settings. The `workspace` table has a `settings` JSONB column. Add:

- `logo_url`
- `primary_color`
- `secondary_color`
- `company_name` (display)

Then update the portal layout to read `settings` and apply them (logo in header, CSS variables for colors).

---

## Deploying (Production)

**Hestia portal at portal.hestiaops.com:** See **[docs/PORTAL_DEPLOYMENT.md](docs/PORTAL_DEPLOYMENT.md)** for the full guide (Vercel, domain, Supabase Auth).

The blueprints recommend **Railway** or **Vercel**. To prepare:

1. Push your code to a Git repo
2. Connect Vercel (or Railway) to the repo
3. Set **Root Directory** to `portal`
4. Set environment variables (same as `.env.local`)
5. Configure custom domain (e.g. `portal.hestiaops.com`)

```bash
cd portal
npx vercel --prod
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project settings.

---

## Troubleshooting

### "Invalid login credentials" or auth errors
- Ensure Supabase Auth is enabled (Project Settings → Auth)
- Check that email signup is allowed
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `portal/.env.local`

### Blank page or redirect loop
- Clear cookies for localhost:3000
- Check browser console for errors
- Ensure `profiles` has a row for your user (created by `handle_new_user` trigger)

### "No client record found" on client dashboard
- Your email must match a `clients.email` in the database
- Create the client first (Team → Clients) and set the email field

### Workspace not found
- Run `./scripts/setup_new_business.sh "Your Name" template` before signing up

---

## Next Steps

1. **Add more team pages** — Capacity, metrics, financial dashboards per your SOPs
2. **Configure branding** — Logo, colors, workspace name from `workspace.settings`
3. **Deploy** — Railway or Vercel with your domain
4. **Invite clients** — Build client invite flow and link emails to `clients` records
