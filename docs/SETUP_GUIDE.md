# Hestia: Zero to Fully Complete Setup Guide

This guide walks you through setting up the Hestia ops system from scratch. Follow each phase in order.

---

## Overview

Hestia has five main components that must be configured:

1. **Supabase** — Database, auth, and storage backend
2. **Execution layer** — Python scripts that perform deterministic work
3. **MCP Server** — Claude AI superagent (reads directives, calls execution)
4. **Portal** — Next.js web app for team and client dashboards
5. **Company bootstrap** — Create your first company and seed directives

---

## Phase 1: Prerequisites

### 1.1 Install Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Portal (Next.js), Supabase CLI via npx |
| **Python** | 3.10+ | Execution scripts, MCP server |
| **Supabase CLI** | Latest | Database migrations (optional for local) |

```bash
# Verify installations
node -v
python3 --version
npx supabase --version   # or: supabase --version if installed globally
```

### 1.2 Clone and Enter the Repo

```bash
cd /path/to/hestia   # or your repo path
```

---

## Phase 2: Supabase Setup

You can use either **local Supabase** (Docker) or a **remote Supabase project**.

### Option A: Remote Supabase (Recommended for Production)

1. **Create a project** at [supabase.com](https://supabase.com) → New Project.

2. **Get credentials** from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

3. **Apply migrations**:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   Or use the Supabase dashboard SQL editor to run migrations in `supabase/migrations/` in order (001 through 005).

### Option B: Local Supabase (Development)

1. **Install Docker** (required for local Supabase).

2. **Start Supabase**:
   ```bash
   npx supabase start
   ```

3. **Note the output** — it prints local URLs and keys. For local dev:
   - `API URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

4. **Migrations** are usually applied automatically on `supabase start`. If not:
   ```bash
   npx supabase db push
   ```

**Schema changes:** Add new migration files (006, 007, …); never edit migrations that have already been applied. See `directives/database/operations/database-migrations.md`.

---

## Phase 3: Environment Configuration

### 3.1 Create `.env` in Repo Root

```bash
cp .env.example .env
```

### 3.2 Fill In Supabase Values

Edit `.env`:

```bash
# Supabase (from Phase 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MCP Server
HESTIA_DIRECTIVES_PATH=./directives

# Integration secrets (add when you connect tools)
# SMARTLEAD_API_KEY=...
```

**Important:** Never commit `.env`. It is in `.gitignore`.

---

## Phase 4: Execution Layer Setup

The execution layer runs deterministic Python scripts (Layer 3 of the architecture).

### 4.1 Create Virtual Environment

```bash
cd execution
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
```

### 4.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 4.3 Verify (from repo root)

```bash
cd ..
python -m execution.operations.setup_company --name "Test Co" --template base --dry-run
```

You should see a dry-run output with `default_directives` and `next_steps`. If you get `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` errors, ensure `.env` is in the repo root and contains those variables.

---

## Phase 5: Bootstrap Your First Company

### 5.1 Run Setup Script

From the **repo root** (with `.env` configured):

```bash
./scripts/setup_new_business.sh "Your Company Name" template_id
```

**Examples:**
- Real estate brokerage: `./scripts/setup_new_business.sh "Acme Realty" brokerage`
- Hestia (infrastructure): `./scripts/setup_new_business.sh "Hestia" hestia`
- Generic: `./scripts/setup_new_business.sh "My Company" base`

**Valid templates:** `base`, `agency`, `professional-services`, `brokerage`, `hestia`

### 5.2 Capture Output

The script prints output like:

```json
{
  "workspace_id": "...",
  "workspace_name": "Your Company Name",
  "template_id": "brokerage",
  "directives_seeded": 5,
  "next_steps": ["Sign up the first user at the portal (first user becomes admin)", ...]
}
```

---

## Phase 6: MCP Server Setup

The MCP server is the AI superagent (Layer 2) that reads directives and calls execution scripts. MCP tools include: clients, projects, tasks, notes, documents, directives, activity, integrations, profiles, warm_leads, applications. See **[MCP_TOOLS_REFERENCE.md](MCP_TOOLS_REFERENCE.md)** for the full reference.

### 6.1 Create Virtual Environment

```bash
cd mcp-server
python3 -m venv .venv
source .venv/bin/activate
```

### 6.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 6.3 Verify MCP Server

From repo root, with `.env` containing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`:

```bash
cd mcp-server
source .venv/bin/activate
python server.py
```

The server should start (stdio transport). Press Ctrl+C to stop.

### 6.4 Connect to Claude Desktop or Cursor

**For Claude Desktop** (per the RIA AI Operations Blueprint): See **[CLAUDE_MCP_SETUP.md](CLAUDE_MCP_SETUP.md)** for the full walkthrough. Config file: `~/Library/Application Support/Claude/claude_desktop_config.json`.

**For Cursor**, add the Hestia MCP server:

1. Open **Cursor Settings** → **MCP** (or edit `~/.cursor/mcp.json`).
2. Add a server entry:

```json
{
  "mcpServers": {
    "hestia": {
      "command": "python",
      "args": ["/absolute/path/to/hestia/mcp-server/server.py"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "HESTIA_DIRECTIVES_PATH": "/absolute/path/to/hestia/directives"
      }
    }
  }
}
```

Replace paths and env values with your actual values. Use absolute paths for reliability.

3. Restart Cursor or reload MCP servers.
4. Confirm the `hestia` server appears and its tools (e.g. `list_directives`, `create_client`) are available.

---

## Phase 7: Portal Setup

The Next.js portal provides team and client dashboards. For a full walkthrough aligned with the RIA and Brokerage blueprints, see **[PORTAL_SETUP.md](PORTAL_SETUP.md)**.

### 7.1 Install Dependencies

```bash
cd portal
npm install
```

### 7.2 Configure Environment

The portal reads from `portal/.env.local`. Create it:

```bash
cp ../.env .env.local
# Or copy the Supabase vars manually:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...  (for server-side admin operations)
```

### 7.3 Run Development Server

```bash
npm run dev
```

The portal runs at `http://localhost:3000`.

### 7.4 First User Signup

1. Go to `http://localhost:3000`.
2. Sign up with display name, email, and password. The first user becomes admin.

---

## Phase 8: Verification Checklist

| Component | How to Verify |
|-----------|----------------|
| **Supabase** | Dashboard shows tables: `workspace`, `profiles`, `clients`, `projects`, `tasks`, `directives`, `activity_log`, etc. |
| **Execution** | `python -m execution.operations.setup_company --dry-run` succeeds |
| **Workspace** | `workspace` table has your config; `directives` table has seeded SOPs |
| **MCP Server** | Cursor shows hestia tools; `list_directives` returns your directives |
| **MCP tools** | `list_profiles`, `search_warm_leads`, `list_applications` return data |
| **Portal** | Login/signup works; you can access team dashboard after signup |

---

## Quick Reference: File Locations

| Item | Path |
|------|------|
| Environment | `.env` (repo root), `portal/.env.local` |
| Directives (SOPs) | `directives/` |
| Execution scripts | `execution/` |
| MCP server | `mcp-server/` |
| Portal | `portal/` |
| Templates | `templates/` |
| Migrations | `supabase/migrations/` |

---

## Troubleshooting

### "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
- Ensure `.env` exists in repo root.
- Execution scripts and MCP server load `.env` from repo root (MCP server uses `load_dotenv("../.env")`).

### MCP server fails to start
- Ensure Phase 5 (workspace setup) has been run.
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in `.env`.

### "supabase: command not found"
- Use `npx supabase` instead of `supabase`, or install globally: `npm install -g supabase`.

### Portal shows blank or auth errors
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `portal/.env.local`.
- Ensure Supabase Auth is enabled and email signup is allowed (Project Settings → Auth).

### MCP server tools not appearing in Cursor
- Use absolute paths in `mcp.json`.
- Restart Cursor after editing MCP config.

### Setup script fails with "Failed to create workspace"
- Verify migrations are applied (`npx supabase db push`).
- Check that `workspace` table exists and RLS allows the service role to insert.

---

## Next Steps After Setup

1. **Add integrations** — When ready, add API keys to `.env` (e.g. `SMARTLEAD_API_KEY`) and create execution scripts in `execution/integrations/`.
2. **Customize directives** — Edit markdown files in `directives/` and update the database via the MCP `update_directive` tool or portal.
3. **Add more clients** — Each client gets their own Supabase project. Run `./scripts/setup_new_business.sh "Client Name" brokerage` for each new deployment.
