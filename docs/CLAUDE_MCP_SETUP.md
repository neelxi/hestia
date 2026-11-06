# Claude MCP (Superagent) Setup Guide

This guide walks you through connecting the Hestia MCP server to **Claude Desktop** and **Cursor**, following the RIA AI Operations Blueprint. The MCP server is your firm's "Superagent" — it connects Claude to your Supabase database so you can execute tasks in plain English.

---

## Prerequisites

Before starting, ensure you have:

1. **Database set up** — Supabase running with migrations applied
2. **Workspace bootstrapped** — Run `./scripts/setup_new_business.sh "Your Company" professional-services`
3. **`.env` configured** — In repo root with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Quick Start: Run the MCP Server

### 1. Activate the virtual environment and start the server

```bash
cd /absolute/path/to/hestia/mcp-server
source .venv/bin/activate
python server.py
```

The server runs on stdio (stdin/stdout). Press Ctrl+C to stop. **You don't need to keep this running manually** — Claude Desktop and Cursor spawn it automatically when you use it.

### 2. Verify it works

From another terminal (with venv active):

```bash
cd /absolute/path/to/hestia/mcp-server
source .venv/bin/activate
python -c "
from server import mcp
print('MCP server loads OK. Tools:', [t.name for t in mcp._tool_manager._tools.values()][:5], '...')
"
```

---

## Connect to Claude Desktop

Per the blueprint, Claude Desktop is where your team talks to the Superagent. Each team member installs Claude Desktop and connects to your MCP server.

### 1. Install Claude Desktop

Download from [claude.ai/download](https://claude.ai/download) if you haven't already.

### 2. Create or edit the config file

On Mac, the config lives at:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Create the file (or edit it) with this structure. **Use your actual paths and values:**

```json
{
  "mcpServers": {
    "hestia": {
      "command": "/absolute/path/to/hestia/mcp-server/.venv/bin/python",
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

**Important:**
- Use the **venv Python** (`mcp-server/.venv/bin/python`) so FastMCP and dependencies are available
- Use **absolute paths** for `args` and `HESTIA_DIRECTIVES_PATH`
- Use your Supabase URL and service role key from `.env`

### 3. Restart Claude Desktop

Quit Claude Desktop completely and reopen it. The hestia tools should appear in the tools menu.

### 4. Test it (Blueprint "moment of truth")

In Claude Desktop, try:

- **"Search for John Smith"** — Claude uses `search_records("clients", "John Smith")`
- **"What's on my plate today?"** — Claude uses `list_records("tasks", {"assignee_id": "<your_profile_id>"}, 50)`
- **"Process my meeting with [client name]"** — Claude uses the `process_meeting` prompt and create_record/list_records
- **"Assign this task to Sarah"** — Claude uses `search_records("profiles", "Sarah")` then `update_record("tasks", task_id, {"assignee_id": profile_id})`

---

## Connect to Cursor

If you use Cursor for development, you can use the same MCP server there.

### 1. Open Cursor MCP settings

**Cursor Settings** → **MCP**, or edit `~/.cursor/mcp.json` directly.

### 2. Add the hestia server

```json
{
  "mcpServers": {
    "hestia": {
      "command": "/absolute/path/to/hestia/mcp-server/.venv/bin/python",
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

### 3. Restart Cursor

Reload MCP servers (or restart Cursor). The hestia tools should appear.

---

## Blueprint Tools vs. Hestia Tools

| Blueprint Tool        | Hestia Equivalent   | Purpose                                      |
|-----------------------|---------------------|----------------------------------------------|
| `search_contacts`     | `search_records("clients", query)` | Search clients by name or email |
| `process_transcript`  | `process_meeting` (prompt) | Process meeting, create tasks, summarize |
| `create_task`         | `create_record("tasks", {...})` | Create a task |
| `get_my_tasks`        | `list_records("tasks", {"assignee_id": profile_id}, 50)` | Get tasks assigned to you |

Hestia uses generic CRUD: `create_record`, `update_record`, `get_record`, `list_records`, `search_records`, `delete_record`. Plus `run_directive`, `list_integrations`, `update_integration`, `get_workspace`, `update_workspace`.

See **[MCP_TOOLS_REFERENCE.md](MCP_TOOLS_REFERENCE.md)** for the full tool list, resources, and prompts.

---

## Troubleshooting

### MCP server fails to start
- Run `./scripts/setup_new_business.sh "Your Company" professional-services` from repo root first
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in your MCP config `env` block

### "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
- Ensure the `env` block in your MCP config has both variables
- Values come from Supabase Dashboard → Project Settings → API

### MCP tools don't appear in Claude Desktop
- Use absolute paths for `command`, `args`, and `HESTIA_DIRECTIVES_PATH`
- Use the venv Python: `mcp-server/.venv/bin/python`
- Restart Claude Desktop fully (quit and reopen)

### "ModuleNotFoundError" when running
- Ensure you're using the venv Python (has fastmcp, supabase, etc.)
- From repo root: `cd mcp-server && pip install -r requirements.txt`

### Only 3 hestia tools appear (run_directive, get_workspace, update_workspace)
Cursor has a **~40-tool limit** across all MCP servers. If you have cursor-ide-browser (33 tools) + hestia (11 tools) = 44, Cursor truncates and you may only see a subset of hestia tools.

**Fix:** In Cursor Settings → Tools & MCP, temporarily **disable cursor-ide-browser** when you need full hestia CRUD (create_record, list_records, search_records, etc.). Or use the per-tool toggles to disable 4+ browser tools you rarely use so all 11 hestia tools fit.

**Verify hestia exposes all 11 tools:**
```bash
cd mcp-server && source .venv/bin/activate && python -c "
import asyncio
from server import mcp
async def main():
    tools = await mcp.list_tools()
    print('Hestia tools:', [t.name for t in tools])
asyncio.run(main())
"
```

---

## Next Steps

1. **Add more directives** — Edit SOPs in `directives/` and sync to the database
2. **Connect integrations** — Add API keys to `.env` for CRM, email, meeting recorders
3. **Train your team** — Share this guide so each person can connect Claude Desktop to the Superagent
