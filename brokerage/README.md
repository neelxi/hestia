# Brokerage AI Operations Framework

A framework specifically for **real estate brokerages**. Hestia supplies the shared operations infrastructure; this package adds brokerage records, terminology, security policies, and workflows. See the [HWA demo runbook](../docs/HWA_DEMO_RUNBOOK.md) for the shortest product walkthrough.

## What's Included

- **Database schema** — Agents, Teams, Transactions, Properties, Commissions, Leads, Recruiting Prospects, Compliance, SOPs, Workflows
- **Portal** — Brokerage-specific views (Agents, Transactions, Commissions, Pipeline)
- **Template config** — Brokerage terminology, workflows, and recommended integrations

## Deployment

### 1. Create a Supabase project for the brokerage

Create a **new** Supabase project (separate from Hestia's). This keeps brokerage data isolated.

### 2. Apply the brokerage schema

```bash
# Option A: Using Supabase CLI (link to brokerage project first)
cd brokerage
supabase link --project-ref <brokerage-project-ref>
supabase db push

# Option B: Run migrations manually
psql $DATABASE_URL -f migrations/001_initial_brokerage_schema.sql
```

### 3. Deploy the portal in brokerage mode

Set the environment variable when deploying the portal:

```bash
NEXT_PUBLIC_PORTAL_MODE=brokerage
```

For Vercel/Railway, add this to your environment config. The portal will then show:

- **Agents** (instead of Clients)
- **Transactions** (instead of Projects)
- **Commissions** (commission queue, disbursements)
- Brokerage-specific dashboard stats

### 4. Bootstrap the workspace

```bash
# Fill .env with the dedicated demo project's URL and service-role key first.
python3 scripts/seed_brokerage_demo.py
```

The seed is repeatable, refreshes all relative dates, and only upserts its own
fictional Summit Realty records. For the HWA walkthrough, use
[`docs/HWA_DEMO_RUNBOOK.md`](../docs/HWA_DEMO_RUNBOOK.md).

## Schema Overview

| Category | Tables |
|----------|--------|
| **People** | `agents`, `teams`, `profiles` (with `agent_id` link) |
| **Transactions** | `transactions`, `properties` |
| **Commissions** | `commissions` |
| **Operations** | `tasks`, `workflows`, `sops` |
| **Leads** | `leads`, `recruiting_prospects`, `warm_leads` |
| **Compliance** | `compliance_records` |
| **Integrations** | `integration_providers`, `integrations` |
| **Audit** | `activity_log`, `audit_log` |

## Roles

- **admin** — Broker-owner; full access
- **team** — Admin staff, TCs, office managers; firm-wide access
- **agent** — Licensed agents; see only their own data (transactions, commissions, leads)

## MCP Superagent

The MCP server can be configured with brokerage-specific tools. See `mcp-server/tools/` for agents, transactions, commissions. When deploying for a brokerage client, point the MCP server at the brokerage Supabase project.

## Differences from Hestia

| Hestia | Brokerage |
|--------|-----------|
| `clients` | `agents` |
| `projects` | `transactions` |
| Generic business ops | Real estate–specific (GCI, splits, cap, license, E&O) |
| Client/Team/Admin roles | Agent/Team/Admin roles |
| Applications, warm_leads | Same + `leads` (agent routing), `recruiting_prospects` |
