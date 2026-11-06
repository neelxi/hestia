---
title: Hestia - Unified Business Operations Platform
category: operations
type: system-blueprint
status: draft
version: 1.0
trigger: manual
description: >
  Master directive documenting the Hestia platform architecture, data model,
  integration layer, AI agent system, portal design, and template system.
  This is the foundational reference for all build and operational directives.
---

# Hestia: Unified Business Operations Platform

A multi-tenant business operations platform that unifies company data, integrates
with external tools (CRMs, meeting recorders, etc.), provides an AI agent for
automated SOP execution, and delivers a portal for both clients and internal teams.
Designed as a template system deployable across different company types.

---

## Architecture Overview

The system has five major components:

1. **Supabase Backend** -- PostgreSQL database with auth, file storage, and realtime.
   All data is multi-tenant, scoped by `company_id` via Row Level Security.

2. **Integration Layer** -- Webhook receivers and polling scripts that ingest data
  from external tools (CRMs, meeting recorders, etc.) into the
   unified database. A normalization pipeline maps external formats to internal schema.

3. **AI Superagent (Claude MCP Server)** -- A FastMCP server deployed per-company
   that gives every employee full read/write access to all company data through
   Claude Desktop or Claude Code. The MCP server IS Layer 2 (orchestration) -- Claude
   handles reasoning while the server provides tools, resources, and prompts.
   Layer 1 (directives) and Layer 3 (execution scripts) are still markdown SOPs and
   Python scripts respectively.

4. **Next.js Portal** -- Web application with three role-based views: client portal,
   team dashboard, and admin panel. Built with Next.js App Router, TypeScript,
   Tailwind CSS, and shadcn/ui.

5. **Template System** -- JSON configuration files that define per-company-type
   settings: data fields, default SOPs, dashboard layouts, terminology, workflows,
   and recommended integrations.

### Data Flow

```
External Tools (CRM, meetings, etc.)
        │
        ▼
┌─────────────────────────┐
│   Integration Layer     │
│  Webhooks + Polling     │
│  ─────────────────      │
│  Raw events logged      │
│  Data normalized        │
│  Field mappings applied │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Supabase (PostgreSQL) │
│  ─────────────────────  │
│  companies, clients,    │
│  projects, tasks, notes,│
│  documents, directives, │
│  integration_events     │
└──┬──────────┬───────────┘
   │          │
   ▼          ▼
┌──────────┐  ┌───────────────────────────────┐
│ Next.js  │  │  Claude MCP Server (per co.)  │
│ Portal   │  │  ───────────────────────────  │
│          │  │  Tools: Full CRUD, directives,│
│ Client   │  │    integrations, activity     │
│ Team     │  │  Resources: dashboards, KPIs  │
│ Admin    │  │  Prompts: onboard, summarize  │
└──────────┘  │  ───────────────────────────  │
              │  Employees use via Claude      │
              │  Desktop / Claude Code         │
              └───────────────────────────────┘
```

---

## Project Structure

```
hestia/
├── README.md
├── .env.example
├── .gitignore
│
├── directives/                 # Layer 1: SOPs (markdown)
│   ├── database/               # Database/platform system directives
│   │   ├── _base/              # Base directives (all companies)
│   │   │   └── onboard-client.md
│   │   ├── operations/
│   │   ├── software/
│   │   ├── financials/
│   │   └── sales/
│   └── marketing/
│
├── execution/                  # Layer 3: Deterministic scripts
│   ├── requirements.txt
│   ├── operations/
│   ├── marketing/
│   ├── software/
│   ├── financials/
│   ├── sales/
│   ├── integrations/           # Integration-specific scripts (add when you integrate)
│   │   └── (e.g. smartlead.py, normalizer.py — add per provider)
│   └── core/                   # Shared utilities
│       ├── supabase_client.py
│       └── utils.py
│
├── mcp-server/                 # Claude MCP Server (Layer 2: Orchestration)
│   ├── requirements.txt        # fastmcp, supabase, pydantic, etc.
│   ├── server.py               # FastMCP server entry point
│   ├── tools/                  # MCP Tool definitions
│   │   ├── clients.py          # CRUD: clients, contacts
│   │   ├── projects.py         # CRUD: projects
│   │   ├── tasks.py            # CRUD: tasks
│   │   ├── documents.py        # CRUD: documents + Supabase Storage
│   │   ├── notes.py            # CRUD: notes, transcripts
│   │   ├── directives.py       # Read/write/execute directives
│   │   ├── integrations.py     # Trigger syncs, manage integrations
│   │   └── activity.py         # Read/write activity log
│   ├── resources/              # MCP Resource definitions
│   │   ├── dashboard.py        # Company KPIs, summaries
│   │   ├── client_data.py      # Client-scoped data views
│   │   └── reports.py          # Generated reports, analytics
│   ├── prompts/                # MCP Prompt templates
│   │   ├── onboard_client.py   # Full client onboarding workflow
│   │   ├── process_meeting.py  # Full meeting processing chain
│   │   ├── prep_for_review.py  # Client review preparation briefing
│   │   ├── status_report.py    # Generate status report
│   │   ├── daily_briefing.py   # Morning summary for team
│   │   ├── run_sop.py          # Generic SOP executor
│   │   └── quarterly_review.py # Quarterly audit/compliance review
│   └── config.py               # Company-scoped configuration
│
├── portal/                     # Next.js web app
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup, forgot password
│   │   │   ├── (client)/       # Client-facing portal
│   │   │   ├── (team)/         # Internal team dashboard
│   │   │   ├── (admin)/        # Admin / company setup + integrations
│   │   │   ├── api/
│   │   │   │   ├── agent/      # Agent trigger routes
│   │   │   │   └── webhooks/   # Inbound webhook receivers
│   │   │   │       ├── [provider]/route.ts
│   │   │   │       └── generic/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Shared UI (shadcn/ui)
│   │   │   ├── dashboard/
│   │   │   └── forms/
│   │   ├── lib/
│   │   │   ├── supabase/       # Supabase client + helpers
│   │   │   ├── auth/           # Auth utilities
│   │   │   └── templates/      # Template config loader
│   │   └── types/
│   │       └── database.ts     # Generated Supabase types
│   └── tailwind.config.ts
│
├── templates/                  # Company type templates
│   ├── base.json               # Base config (shared fields, SOPs)
│   ├── professional-services.json
│   ├── agency.json
│   └── retail.json
│
└── supabase/                   # Supabase local config + migrations
    ├── config.toml
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Database Schema (Single-Tenant)

One workspace per deployment. Role-based RLS (admin/team/client).

### Core Tables

- **workspace** -- Single config row. Fields: name, type, settings (JSON), template_id.
- **profiles** -- Extends Supabase auth.users. Fields: role (admin/team/client), display_name, avatar_url.
- **clients** -- Client records. Fields: name, email, phone, status, external_id, metadata (JSON).
- **projects** -- Tied to clients. Fields: client_id, name, status, start_date, end_date, budget, description.
- **tasks** -- Within projects. Fields: project_id, client_id, title, description, status, priority, assignee_id, due_date.
- **documents** -- File references (Supabase Storage). Fields: client_id, project_id, name, file_path, uploaded_by.
- **notes** -- Meeting transcripts, call notes, emails. Fields: client_id, project_id, source, content, type, metadata (JSON).
- **directives** -- SOPs stored in DB. Fields: title, content (markdown), category, is_automated, trigger_conditions (JSON).
- **directive_runs** -- Audit log of AI executing directives. Fields: directive_id, status, input (JSON), output (JSON), started_at, completed_at.
- **activity_log** -- General audit trail. Fields: actor_id, action, entity_type, entity_id, details (JSON), created_at.

### Integration Tables

- **integration_providers** -- Registry of supported providers. Not seeded by default; add your own when you add integrations. Fields: name, slug, auth_type (oauth/api_key/webhook_only), config_schema (JSON), logo_url, description.
- **integrations** -- Connected integrations. Fields: provider_id, credentials_encrypted, field_mappings (JSON), status (active/paused/error), last_synced_at, webhook_secret.
- **integration_events** -- Raw inbound event log. Fields: integration_id, event_type, raw_payload (JSON), processed_status (pending/processed/failed), error_message, created_at.
- **field_mappings** -- Maps external fields to internal schema. Fields: integration_id, external_field, internal_table, internal_field, transform_fn.

### RLS Policies

- Team/admin users see all data
- Client users see only their own `clients` record + linked projects/tasks/documents
- Admins can manage company settings, user roles, and integrations
- Integration webhook endpoints use service role key (bypasses RLS) to write inbound data

---

## Integration Layer

Hestia is the central data hub. All external tools feed into it.

### Three Inbound Methods

1. **Webhooks** -- External tools POST to `/api/webhooks/[provider]/route.ts`. Each provider route validates signatures, stores the raw event in `integration_events`, then normalizes. Add provider-specific routes (e.g. smartlead) when you integrate.

2. **Polling** -- Python scripts in `execution/integrations/` run on a schedule (cron or agent-triggered). For tools without webhook support or for backfill. Add scripts per provider when you integrate.

3. **Manual Import** -- CSV/JSON file upload via the admin UI. Parsed and normalized into the internal schema.

When you add integrations, add a normalizer (e.g. `execution/integrations/normalizer.py` or per-provider):

1. Receives raw event + provider config
2. Looks up `field_mappings` for the company's integration
3. Maps external fields to internal table columns (e.g. external `name` → `clients.name`)
4. Handles deduplication (match on email or external_id)
5. Writes to the appropriate core table(s)
6. If a linked directive trigger exists (e.g. "on new meeting transcript, summarize and create tasks"), fires the agent

### Adding providers

1. **Register the provider** — Insert into `integration_providers`: `name`, `slug` (e.g. `smartlead`), `auth_type` (`oauth` / `api_key` / `webhook_only`), `description`. No default providers are seeded.
2. **Connect for your company** — Insert into `company_integrations`: `company_id`, `provider_id`, `webhook_secret` (if using webhooks), `status` = `active`. Optionally store API keys in `credentials_encrypted`.
3. **Webhooks** — External tool POSTs to `/api/webhooks/[slug]` with header `x-webhook-secret`. Events are stored in `integration_events` with `processed_status` = `pending`.
4. **Process events** — Add a script in `execution/integrations/` (e.g. `smartlead.py`) or a directive that reads `integration_events`, normalizes payloads, and writes to `clients`, `notes`, `warm_leads`, etc. Optionally use `field_mappings` to map external fields to internal columns.

- Webhook endpoints validate the secret (per `company_integrations.webhook_secret`)
- OAuth tokens and API keys stored encrypted in `company_integrations.credentials_encrypted`
- All raw payloads logged to `integration_events` for debugging and replay
- RLS ensures integration data is scoped to `company_id`

---

## AI Superagent (Claude MCP Server)

The AI agent is deployed as a Claude MCP server built with FastMCP (Python).
Each company gets its own MCP server instance, scoped to their `company_id`.
Every employee connects to it via Claude Desktop or Claude Code and can use
natural language to read, write, and manage all company data.

### Why MCP Instead of a Standalone Agent

- Employees talk to the agent directly through Claude -- no separate UI needed
- Claude handles reasoning/orchestration (Layer 2); the MCP server provides tools and data
- Each company gets an isolated instance with its own credentials and data scope
- New capabilities = new tools added to the server, instantly available to all employees
- Full read/write access to everything: clients, tasks, directives, integrations, files

### MCP Server Components

**Tools (11 total — generic CRUD + special):**

- **Generic CRUD:** delete_record, create_record, update_record, get_record, list_records, search_records — work across clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations, activity_log, directive_runs, profiles, workspace
- **Special:** run_directive (execute SOP), list_integrations, update_integration, get_workspace, update_workspace

Full tool reference: docs/MCP_TOOLS_REFERENCE.md

**Resources (read-only data Claude can reference):**

- hestia://dashboard -- Company KPIs, pipeline summary, recent activity
- hestia://clients/{id} -- Full client profile with projects, tasks, notes
- hestia://directives -- All SOPs and their execution history
- hestia://integrations/status -- Sync status of all connected tools
- hestia://activity/recent -- Recent activity feed

**Prompts (pre-built workflow templates):**

- onboard_client -- Full client onboarding: create record, set up project, generate
  document checklist, assign team, schedule follow-up, send welcome packet, log audit
- process_meeting -- Full meeting processing chain: pull transcript from recording tool,
  extract discussion points, identify action items with owners and due dates, create
  tasks, update client record with new info, generate summary, send to client
- prep_for_review -- Client review preparation: pull recent activity, open tasks,
  meeting history, project status, notes, and relevant documents into a briefing package
- generate_status_report -- Builds a status report for a client or project
- daily_briefing -- Morning summary of tasks, events, integration updates, and items
  needing attention
- run_sop -- Generic: execute any SOP by name, following its directive step by step
- quarterly_review -- Audit trail review, flag missing items, generate compliance or
  operations summary report

### Deployment: One MCP Per Company

Each company instance runs as its own process with company-specific env vars.
Employees add it to their Claude Desktop config:

```json
{
  "mcpServers": {
    "hestia": {
      "command": "python",
      "args": ["/path/to/mcp-server/server.py"],
      "env": {
        "COMPANY_ID": "company-uuid",
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJ...",
        "HESTIA_DIRECTIVES_PATH": "/path/to/directives"
      }
    }
  }
}
```

The server reads COMPANY_ID at startup and scopes ALL queries to that tenant.
The service role key gives full read/write access (bypasses RLS), but every
action is logged to activity_log with actor: "mcp-agent" and employee identity.

### 3-Layer Architecture (Preserved)

The MCP server IS Layer 2 (orchestration). It still uses Layer 1 and Layer 3:

- Layer 1 -- Directives: Markdown SOPs in `directives/` with structured front matter.
  The MCP `run_directive` tool parses a directive, follows its instructions, and
  calls the appropriate execution scripts.
- Layer 2 -- MCP Server: Claude + FastMCP tools handle reasoning, routing, error
  handling. This replaces the standalone orchestrator.py.
- Layer 3 -- Execution: Python scripts in `execution/` do the deterministic work.
  The MCP server calls them via subprocess or direct import.

---

## Base SOPs (Template-Included)

Every company deployment includes these base SOPs. Each SOP has three parts:
the SOP itself (human-readable process), the directive (AI-executable instructions),
and the tools (Python scripts the Superagent calls). SOPs are written in the
AI-executable format: trigger, steps, decision points, tools, verification.

Templates can rename, extend, or add industry-specific SOPs on top of these.

### SOP 1: Client Onboarding

**Trigger:** New client signs agreement / is added to the system.

**The problem:** Onboarding a new client means hours of manual work spread across
the team over several days. Someone creates the record. Someone else sets up the
project. A third person creates the document checklist. Steps get missed. Things
fall through the cracks.

**What the Superagent does:** Team member says "Onboard [client name]." The
Superagent creates the client record with all provided information, creates the
default project, generates the document collection checklist with tasks assigned
to the appropriate team members, schedules the follow-up meeting, sends the
welcome packet with portal credentials, and logs everything in the activity trail.

**Human steps:** The team handles parts that require judgment -- initial
consultation, needs assessment, and any manual account setup with third parties.

**Tools used:** `create_client`, `create_project`, `create_task`,
`schedule_followup`, `generate_welcome_packet`, `notify_team`, `log_activity`

**Verification:** Client record exists with all required fields. Project exists
with correct status. All onboarding tasks created and assigned. Welcome packet
sent. Follow-up scheduled. Activity log entry created.

**Template customization examples:**
- RIA: creates household, links family members, assigns advisor, generates
  compliance document checklist (tax returns, statements, estate docs)
- Brokerage: creates agent record, configures system access across tools,
  generates license/compliance checklist
- Agency: creates client account, sets up project workspace, generates
  creative brief template

---

### SOP 2: Process Meeting

**Trigger:** Meeting completed and transcript available (from a connected recording integration or manual paste).

**The problem:** After every meeting, someone spends 30-45 minutes logging notes,
creating follow-up tasks, emailing the client a summary, and updating records.
Multiply by 20 meetings a week and that's 10+ hours gone. Half the time the
notes are incomplete because the person rushed to get to the next meeting.

**What the Superagent does:** Team member says "Process my meeting with [client]."
The Superagent pulls the transcript from the connected recording tool, extracts
key discussion points, identifies every action item with owners and due dates,
creates tasks for each one, updates the client record with any new information
discussed, and generates a clean summary. The team member reviews in ~2 minutes,
approves, and the summary is sent to the client.

**Human steps:** Review the AI-generated summary and action items. Approve before
sending to client. Flag anything that needs correction.

**Tools used:** `get_meeting_transcript`, `create_note`, `create_task`,
`update_client`, `send_client_summary`, `log_activity`

**Verification:** Meeting note created with summary and full transcript reference.
All action items extracted and created as tasks with assignees and due dates.
Client record updated. Summary sent to client (if approved). Activity logged.

**This is the single highest-ROI SOP.** Most companies start here. At 20 meetings
per week, 2 minutes instead of 30 = 9+ hours/week recovered.

---

### SOP 3: Review/Meeting Preparation

**Trigger:** Upcoming client review (scheduled, or team member says "Prep for
[client] review").

**The problem:** Preparing for a client review means 30-60 minutes pulling data
from multiple systems. Recent activity from one tool. Project status from another.
Meeting notes from the CRM. Then manually assembling it into a review package.

**What the Superagent does:** Team member says "Prep for the [client] review."
The Superagent generates a briefing package: pulls the client's full profile,
recent activity and communication history, all open tasks and their status,
project progress, recent meeting summaries and action item status, and any
relevant documents. Assembles into a structured review agenda with discussion
points.

**Human steps:** Review the auto-generated package (~10 minutes). Add personal
notes or talking points. Adjust the agenda as needed.

**Tools used:** `get_client`, `list_tasks`, `search_notes`, `list_documents`,
`list_projects`, `generate_report`, `log_activity`

**Verification:** Briefing package generated with all sections populated.
No stale data (all pulled from current database state). Activity logged.

---

### SOP 4: Task/Workflow Processing

**Trigger:** A workflow event occurs (e.g., a transaction closes, a document is
signed, a milestone is reached, a request comes in).

**The problem:** Routine operational tasks require toggling between 3-4 systems,
manual data entry, cross-referencing records, and notifying the right people.
Each instance takes 20-30 minutes of low-value work.

**What the Superagent does:** Team member describes the event: "Process the
[task/transaction/request] for [client]." The Superagent logs the event with
full details, runs any automated checks or validations, updates the relevant
records, creates follow-up tasks, notifies the appropriate team members, and
files documentation.

**Human steps:** Handle the parts that require judgment, verification, or
third-party interaction. Review and approve the Superagent's work.

**Tools used:** `create_task`, `update_client`, `update_project`, `notify_team`,
`upload_document`, `log_activity`

**Verification:** Event logged. Records updated. Follow-up tasks created and
assigned. Notifications sent. Documentation filed. Activity trail complete.

**Template customization examples:**
- RIA: money movement processing (compliance checks, custodian interaction,
  client notification, audit trail)
- Brokerage: closing/transaction coordination (commission calculation,
  disbursement, production update, compliance verification)
- Agency: deliverable handoff (client approval, revision tracking, billing trigger)

---

### SOP 5: Periodic Review / Compliance Audit

**Trigger:** Scheduled interval (quarterly, monthly, etc.) or manual trigger.

**The problem:** Someone spends 4-6 hours reviewing activity logs, checking that
all processes were followed, scanning for missing items, verifying team
certifications or deadlines, and compiling a summary report. Tedious, manual,
and easy to miss things.

**What the Superagent does:** Team member says "Run the quarterly review" (or it
triggers automatically on schedule). The Superagent reviews the entire period's
activity log, verifies that all required processes were completed, flags missing
or incomplete items, checks any tracked deadlines or certifications, and generates
a comprehensive summary report. The reviewer approves and creates remediation
tasks for anything that needs attention.

**Human steps:** Review the auto-generated report (~30 minutes). Approve findings.
Create remediation tasks for flagged items.

**Tools used:** `get_activity_feed`, `search_everything`, `generate_report`,
`create_task`, `log_activity`

**Verification:** Report generated covering the full period. All flagged items
documented. Remediation tasks created where needed. Activity logged.

**Template customization examples:**
- RIA: compliance quarterly review (regulatory audit trail, unsigned agreements,
  CE credits, marketing material review)
- Brokerage: license tracking, transaction audit, commission reconciliation review
- Agency: project profitability review, utilization report, client satisfaction check

---

### SOP Format Reference

Every SOP follows this structure. New SOPs added to the system use the same format:

```yaml
---
title: [SOP Name]
category: operations | marketing | sales | financials | software
trigger: manual | schedule | event
schedule: (if trigger=schedule) cron expression or interval
event: (if trigger=event) integration event type
inputs: [list of required inputs]
outputs: [list of expected outputs]
tools: [list of execution scripts used]
verification: [list of checks to confirm success]
---

[Natural language instructions for the Superagent to follow, step by step.
Include decision points, edge cases, and what to do when something fails.]
```

The `run_sop` MCP prompt accepts any SOP by name, reads its directive, and
executes it step by step using the listed tools.

---

## Portal (Next.js)

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase JS client.

### Auth Flow

Supabase Auth with email/password. Middleware checks user role from `profiles`
table and redirects to the appropriate route group:

- `admin` → `/(admin)/` routes
- `team` → `/(team)/` routes
- `client` → `/(client)/` routes

### Client Portal

- `/client/dashboard` -- Overview: key metrics, recent activity, upcoming meetings, action items needing attention
- `/client/accounts` -- All accounts/services in one view (template-configurable label: "Accounts" for RIA, "Pipeline" for brokerage, "Projects" for agency, etc.)
- `/client/projects` -- List of their projects + tasks
- `/client/documents` -- Shared documents/files, organized by category
- `/client/meetings` -- Meeting summaries, transcripts, and action items from recorded meetings
- `/client/messages` -- Communication thread (stretch goal)

### Team Dashboard (role-based views)

**All team members see:**
- `/team/dashboard` -- Personal task queue, upcoming meetings, recent activity
- `/team/clients` -- Client list with search/filter
- `/team/clients/[id]` -- Client detail (projects, tasks, documents, notes, meeting history)
- `/team/projects` -- All projects view
- `/team/tasks` -- Task board (kanban or list), filterable by priority, assignee, due date
- `/team/directives` -- SOP library: browse, search, and trigger AI execution
- `/team/activity` -- Activity feed / audit log (includes integration events)

**Owner/principal view (admin role sees additional):**
- `/team/metrics` -- Firm-wide command center: total revenue, client count, growth trends
- `/team/capacity` -- Team capacity: workload per member, who's at capacity, hiring signals
- `/team/financial` -- Operational costs, billing, margin analysis (template-configurable)

### Admin Pages

- `/admin/settings` -- Company settings, template selection
- `/admin/users` -- Manage team + client user accounts
- `/admin/templates` -- View/customize template configuration
- `/admin/integrations` -- Connect/disconnect external tools, configure field mappings
- `/admin/integrations/[id]` -- Per-integration: credentials, mapping editor, sync status, event log

---

## Template System

Templates are JSON config files in `templates/` that define per-company-type:

- **Data schema extensions** -- Which optional fields/tables are active
- **Default directives** -- Which SOPs to clone on company setup
- **Dashboard layout** -- Which widgets/cards to show on team + client dashboards
- **Terminology** -- Custom labels for entities AND roles:
  - Entity labels: "Clients" vs "Patients" vs "Accounts" vs "Households"
  - Role labels: "Team" vs "Advisors" vs "Agents"; "Client" vs "Patient" vs "Household"
  - Client portal labels: "Accounts" vs "Pipeline" vs "Projects" vs "Portfolio"
  - Metric labels: "Revenue" vs "GCI" vs "AUM" vs "Billings"
- **Workflows** -- Default project stages, task statuses
- **Recommended integrations** -- Which providers are most relevant for this type
- **Integration field mappings** -- Default mapping presets per provider
- **Compliance mode** -- Whether compliance features are active (audit trail emphasis,
  quarterly review SOP, compliance dashboard). On for regulated industries (RIA,
  brokerage, healthcare). Off by default for non-regulated.
- **Owner dashboard modules** -- Which metrics/capacity/financial panels are active
  on the owner view (e.g., RIA gets AUM + advisor capacity; brokerage gets GCI +
  agent count; agency gets revenue + utilization)

On company creation, the system reads the selected template, seeds the database
with default directives, configures the portal layout, and pre-populates
recommended integration configs.

---

## Implementation Order

Build bottom-up: data layer first, then MCP server, then integrations, then portal.

1. Scaffold -- project structure, configs, dependencies
2. Supabase schema -- all tables including integration tables, RLS policies
3. Supabase clients -- JS + Python clients
4. Template system -- JSON configs + loader
5. MCP server core -- FastMCP server with full CRUD tools for all tables
6. MCP resources + prompts -- dashboard data, reports, workflow prompts
7. Integration layer -- webhook routes, normalizer, provider scripts
8. MCP integration tools -- wire integration events into MCP tools
9. Base directives -- write SOPs + matching execution scripts
10. Portal auth -- login, signup, role-based routing
11. Portal team dashboard -- clients, tasks, projects, activity, directives
12. Portal client dashboard -- client-facing views
13. Portal admin -- settings, users, integration management UI

---

## Edge Cases and Learnings

_This section is updated as the system encounters errors and discovers solutions._

- (none yet -- will be populated during build and operation)
