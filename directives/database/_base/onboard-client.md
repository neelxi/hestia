---
title: Client Onboarding
category: operations
trigger: manual
description: >
  Full client onboarding workflow. Creates the client record, default project,
  task checklist, schedules follow-up, sends welcome notification, and logs
  all activity. Triggered when a team member says "Onboard [client name]".
inputs:
  - client_name (string, required)
  - client_email (string, required)
  - client_phone (string, optional)
  - assigned_team_member (string, optional — profile display_name or id)
  - project_name (string, optional — defaults to "Onboarding — {client_name}")
  - notes (string, optional — freeform context about the client)
outputs:
  - client record (id, name, email, status=active)
  - project record (id, linked to client)
  - task checklist (list of task ids)
  - activity_log entry for the onboarding event
tools:
  - execution/operations/onboard_client.py
  - mcp: create_record, update_record, list_records, search_records, delete_record
verification:
  - Client record exists with status=active and all required fields populated
  - Project exists linked to client with status=active
  - All onboarding tasks created with correct assignees and due dates
  - Welcome notification sent (or queued)
  - Activity log entry created with actor_type=mcp-agent and action=client_onboarded
---

# Client Onboarding SOP

## Purpose

Standardize and automate the process of bringing a new client into the system.
Reduces a multi-hour, multi-person process to a single command with human
review at the end.

---

## Step-by-Step Instructions

### Step 1: Validate Inputs

- Confirm `client_name` and `client_email` are provided.
- If `client_email` already exists in the `clients` table, STOP and inform the
  team member: "A client with this email already exists. Did you mean to update
  their record?"
- If `project_name` is not provided, default to "Onboarding — {client_name}".

### Step 2: Create Client Record

Run `execution/operations/onboard_client.py` with the provided inputs, OR use
the MCP `create_client` tool:

- name: `client_name`
- email: `client_email`
- phone: `client_phone` (if provided)
- status: `active`
- metadata: `{ "onboarded_at": "<current timestamp>", "onboarded_by": "<actor>" }`

Capture the returned `client_id`.

### Step 3: Create Default Project

Create a project linked to the new client:

- name: `project_name`
- client_id: the id from Step 2
- status: `active`
- start_date: today
- description: "Default onboarding project for {client_name}"

Capture the returned `project_id`.

### Step 4: Generate Task Checklist

Create the following tasks, all linked to the client and project from above.
Set `due_date` relative to today unless overridden. Assign to the
`assigned_team_member` if provided, otherwise leave unassigned.

| # | Task Title                              | Priority | Due        |
|---|----------------------------------------|----------|------------|
| 1 | Send welcome email / packet            | high     | today      |
| 2 | Schedule initial consultation          | high     | +2 days    |
| 3 | Collect required documents             | medium   | +5 days    |
| 4 | Set up client portal access            | high     | +1 day     |
| 5 | Complete needs assessment              | medium   | +7 days    |
| 6 | Create service agreement               | medium   | +5 days    |
| 7 | Configure integrations (if applicable) | low      | +10 days   |
| 8 | First progress check-in                | medium   | +14 days   |

Templates may add or replace tasks for industry-specific onboarding.

### Step 5: Schedule Follow-Up

If a scheduling tool is connected, create a follow-up meeting for +2 business
days with the client and the assigned team member. If no scheduling tool is
available, create a task: "Schedule initial consultation with {client_name}"
with priority=high and due_date=+2 days.

### Step 6: Send Welcome Notification

Use `notify_team` to inform the team channel/member:

> "New client onboarded: {client_name} ({client_email}). Project:
> {project_name}. {N} onboarding tasks created."

If a client notification mechanism exists (email template, portal invite),
trigger it as well.

### Step 7: Log Activity

Create an `activity_log` entry:

- actor_type: `mcp-agent`
- action: `client_onboarded`
- entity_type: `client`
- entity_id: `client_id`
- details: `{ "project_id": "<id>", "tasks_created": <count>, "client_email": "<email>" }`

### Step 8: Report Back

Return a summary to the team member:

> "Onboarded {client_name}:
> - Client ID: {client_id}
> - Project: {project_name} ({project_id})
> - {N} tasks created
> - Welcome notification sent
> - Follow-up scheduled for {date}"

---

## Edge Cases

- **Duplicate email:** Do not create. Inform team member and offer to open the
  existing record instead.
- **Missing required fields:** Prompt the team member for the missing info
  before proceeding.
- **Script failure:** If `onboard_client.py` errors, read the traceback, fix
  if possible (e.g., missing env var), and retry. Log the error in the
  directive run record.
- **Partial completion:** If the process fails mid-way, report what was
  completed and what still needs attention. Do not silently swallow failures.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
