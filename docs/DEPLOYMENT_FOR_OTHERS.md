# Setting Up Hestia for Someone Else

This guide covers how to deploy or hand off Hestia to another person or company — whether they run it on their own machine, or you deploy it for them.

---

## Two Main Scenarios

| Scenario | Who does what | Best for |
|----------|---------------|----------|
| **A: Self-service** | They clone the repo, create their own Supabase project, run everything on their machine | Technical users, firms who want full control |
| **B: You deploy for them** | You set up Supabase + hosted portal; they use the portal and configure Claude on their machines | Non-technical clients, faster onboarding |

---

## Scenario A: They Run It Themselves

Give them the repo (or a zip) and this checklist. They follow it on their machine.

### Handoff Package

1. **Repo access** — Git clone URL, or a zip of the codebase
2. **This doc** — `docs/DEPLOYMENT_FOR_OTHERS.md` (or a one-pager you create from it)
3. **Template choice** — Which template fits them: `brokerage`, `professional-services`, `agency`, `base`, or `hestia`

### Their Setup Steps (on their machine)

**1. Prerequisites**
- Node.js 18+, Python 3.10+, (optional) Docker for local Supabase
- Git (if cloning)

**2. Clone and install**
```bash
git clone <repo-url> hestia
cd hestia
```

**3. Supabase (their project)**
- Create a project at [supabase.com](https://supabase.com)
- Project Settings → API: copy URL, anon key, service_role key
- Run migrations: `npx supabase link --project-ref THEIR_REF` then `npx supabase db push`
- Or run SQL from `supabase/migrations/` in order (001, 002, 003, 004, 005) via Supabase SQL editor

**4. Environment**
```bash
cp .env.example .env
# Edit .env with their Supabase URL, anon key, service_role key
```

**5. Bootstrap their workspace**
```bash
./scripts/setup_new_business.sh "Their Company Name" professional-services
# (or brokerage, agency, base, hestia)
```

**6. Portal**
```bash
./portal/scripts/setup-env.sh
cd portal && npm install && npm run dev
```
- Sign up at http://localhost:3000 (first user becomes admin)

**7. MCP (Claude Desktop / Cursor)**
- Follow `docs/CLAUDE_MCP_SETUP.md`

**8. Execution layer (optional, for scripts)**
```bash
cd execution && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

### One-Pager You Can Send Them

> **Hestia setup (self-hosted)**  
> 1. Create Supabase project → get URL, anon key, service_role key  
> 2. Clone repo, copy `.env.example` to `.env`, fill in Supabase values  
> 3. Run `npx supabase db push` (or apply migrations manually)  
> 4. Run `./scripts/setup_new_business.sh "Your Company" professional-services`  
> 5. Run `./portal/scripts/setup-env.sh`, then `cd portal && npm install && npm run dev`  
> 6. Sign up at localhost:3000 (first user becomes admin)  
> 8. Configure Claude Desktop per `docs/CLAUDE_MCP_SETUP.md`  

---

## Scenario B: You Deploy for Them

**→ Full step-by-step guide: [DEPLOY_FOR_CLIENTS.md](DEPLOY_FOR_CLIENTS.md)**

You set up the backend and portal; they only configure Claude and use the portal.

### What You Do (Summary)

**1. Supabase**
- Create a project (yours or theirs)
- Apply migrations
- Get URL, anon key, service_role key

**2. Bootstrap their workspace**
```bash
./scripts/setup_new_business.sh "Their Company Name" brokerage
```

**3. Deploy the portal**
- **Vercel:** Connect repo, set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), deploy `portal/`
- **Railway:** Same env vars, deploy from `portal/` directory
- Point a domain (e.g. `portal.theircompany.com`) if desired

**4. Share with them**
- Portal URL
- Supabase URL and anon key (only if they need MCP — keep service_role key secret)

### What They Do

**1. Portal**
- Go to the URL you gave them
- Sign up with display name, email, and password

**2. Claude Desktop**
- Install Claude Desktop
- Add MCP config (see `docs/CLAUDE_MCP_SETUP.md`) with:
  - Your repo path (if they have it) or a path you provide
  - `SUPABASE_URL` = the project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = **only if you trust them with it** — otherwise they need the MCP server running somewhere with the key, or you run it for them

**MCP access options when you deploy:**
- **Option 1:** They run the MCP locally (clone repo, run `python server.py`) with env vars you provide — they need the service role key
- **Option 2:** You host the MCP (e.g. as a long-running process or serverless) and they connect to it — they never see the key
- **Option 3:** They use the portal only, no Claude MCP — portal has team/client views; MCP is optional for the "Superagent" experience

---

## Single-Tenant: One Supabase Per Client

Each client gets their own Supabase project. Run `setup_new_business.sh` once per deployment. No shared database.

---

## Checklist: First-Time Setup for a New Client

| Step | Owner | Action |
|------|-------|--------|
| 1 | You or them | Create Supabase project |
| 2 | You or them | Apply migrations |
| 3 | You or them | Run `setup_new_business.sh "Company Name" template` |
| 4 | You or them | Deploy portal (or run locally) |
| 5 | Them | Sign up at portal |
| 6 | Them | Configure Claude Desktop with MCP (optional) |
| 7 | Them | Confirm email (Supabase Auth) if required |

---

## Security Notes

- **Never share `SUPABASE_SERVICE_ROLE_KEY`** unless they need to run execution scripts or MCP with full DB access
- **Anon key** is safe for client-side (portal); it respects RLS
- **Service role key** bypasses RLS — only use in trusted environments (your server, their secure machine)
