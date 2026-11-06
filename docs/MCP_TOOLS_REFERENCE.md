# Hestia MCP Tools Reference

Single source of truth for all MCP tools, resources, and prompts. See [CLAUDE_MCP_SETUP.md](CLAUDE_MCP_SETUP.md) for connection instructions.

**Cursor 40-tool limit:** If you only see 3 hestia tools (run_directive, get_workspace, update_workspace), disable cursor-ide-browser or other MCP servers in Cursor Settings → Tools & MCP so all 11 hestia tools fit. See [CLAUDE_MCP_SETUP.md#troubleshooting](CLAUDE_MCP_SETUP.md).

---

## Tools (11 total)

### Generic CRUD

| Tool | Purpose |
|------|---------|
| `delete_record(table, record_id)` | Permanently remove. Tables: clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations |
| `create_record(table, data)` | Create. Tables: clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations, activity_log, directive_runs |
| `update_record(table, record_id, updates)` | Update. Same + directive_runs, workspace |
| `get_record(table, record_id)` | Get one by ID. All tables |
| `list_records(table, filters, limit)` | List with optional filters (e.g. client_id, status, assignee_id) |
| `search_records(table, query, filters, limit)` | Text search. Tables: clients (name, email), notes (content), warm_leads, applications, profiles (display_name) |

### Special

| Tool | Purpose |
|------|---------|
| `run_directive(directive_id, input_data)` | Execute an SOP; returns content to follow. Mark done with update_record("directive_runs", run_id, {"status": "completed", "output": {...}}) |
| `list_integrations()` | List integrations with provider names |
| `update_integration(integration_id, updates)` | Update status or field_mappings only |
| `get_workspace()` | Get workspace config (singleton) |
| `update_workspace(updates)` | Update workspace |

---

## Examples

- Create client: `create_record("clients", {"name": "Acme", "email": "a@b.com", "status": "active"})`
- Search clients: `search_records("clients", "john")`
- List tasks for project: `list_records("tasks", {"project_id": "uuid"}, 50)`
- Assign task: `update_record("tasks", task_id, {"assignee_id": profile_id})`
- Delete directive: `delete_record("directives", directive_id)`
- Log activity: `create_record("activity_log", {"action": "client_onboarded", "entity_type": "client", "entity_id": client_id, "actor_type": "mcp-agent"})`
- Find profile for assignment: `search_records("profiles", "Sarah")` → use returned id as assignee_id

---

## Resource URIs

| URI | Purpose |
|-----|---------|
| `hestia://dashboard` | Company KPIs, pipeline summary, recent activity |
| `hestia://clients/{id}` | Full client profile with projects, tasks, notes |
| `hestia://directives` | All SOPs and execution history |

---

## Prompts

| Prompt | Purpose |
|--------|---------|
| `onboard_client` | Full client onboarding workflow |
| `process_meeting` | Meeting processing chain (transcript → tasks, summary) |
| `prep_for_review` | Client review preparation briefing |
| `status_report` | Generate status report |
| `daily_briefing` | Morning summary for team |
| `run_sop` | Generic SOP executor by name |
| `quarterly_review` | Audit/compliance review |
