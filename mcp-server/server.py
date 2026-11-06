"""Hestia MCP Server — unified business operations for Claude."""

import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastmcp import FastMCP

from tools import crud, directives_special, integrations, workspace
from resources import dashboard, client_data, reports, docs
from prompts import (
    onboard_client,
    process_meeting,
    prep_for_review,
    status_report,
    daily_briefing,
    run_sop,
    quarterly_review,
)

HESTIA_INSTRUCTIONS = """
You are the Hestia Superagent. You connect to the Supabase database through generic CRUD tools.

**Generic tools (use these for most operations):**
- **delete_record(table, record_id)** — Permanently remove. Tables: clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations.
- **create_record(table, data)** — Create. Tables: clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations, activity_log, directive_runs.
- **update_record(table, record_id, updates)** — Update. Same tables + directive_runs, workspace.
- **get_record(table, record_id)** — Get one by ID.
- **list_records(table, filters, limit)** — List with optional filters (e.g. client_id, status, assignee_id).
- **search_records(table, query, filters, limit)** — Text search. Tables: clients (name, email), notes (content), warm_leads, applications, profiles (display_name).

**Special tools:**
- **run_directive(directive_id, input_data)** — Execute an SOP; returns content to follow. Mark done with update_record("directive_runs", run_id, {"status": "completed", "output": {...}}).
- **list_integrations()** — List integrations with provider names.
- **update_integration(integration_id, updates)** — Update status or field_mappings only.
- **get_workspace()** — Get workspace config (singleton).
- **update_workspace(updates)** — Update workspace.

**Brokerage tables:** agents, teams, transactions, properties, commissions,
leads, recruiting_prospects, compliance_records, sops, workflows, tasks,
documents, activity_log, integrations. Use the same generic CRUD tools for
these tables. Brokerage tasks link to transactions with transaction_id.

**Resources:** hestia://dashboard (KPIs), hestia://clients/{id} (full profile), hestia://directives (SOPs + runs), hestia://docs (internal docs).

**Examples:**
- Create client: create_record("clients", {"name": "Acme", "email": "a@b.com", "status": "active"})
- Search clients: search_records("clients", "john")
- List tasks for project: list_records("tasks", {"project_id": "uuid"}, 50)
- Assign task: update_record("tasks", task_id, {"assignee_id": profile_id})
- Delete directive: delete_record("directives", directive_id)
- Log activity: create_record("activity_log", {"action": "client_onboarded", "entity_type": "client", "entity_id": client_id, "actor_type": "mcp-agent"})
"""

mcp = FastMCP("hestia", instructions=HESTIA_INSTRUCTIONS)

# -- Tools --
crud.register(mcp)
directives_special.register(mcp)
integrations.register(mcp)
workspace.register(mcp)

# -- Resources --
dashboard.register(mcp)
client_data.register(mcp)
reports.register(mcp)
docs.register(mcp)

# -- Prompts --
onboard_client.register(mcp)
process_meeting.register(mcp)
prep_for_review.register(mcp)
status_report.register(mcp)
daily_briefing.register(mcp)
run_sop.register(mcp)
quarterly_review.register(mcp)

if __name__ == "__main__":
    mcp.run()
