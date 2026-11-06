---
title: Task / Workflow Processing
category: operations
trigger: manual or event
description: >
  Generic SOP for processing a workflow event — a transaction closing, document
  signing, milestone reached, or ad-hoc request. Logs the event, validates
  inputs, updates records, creates follow-ups, notifies the team, and maintains
  the audit trail. Triggered manually ("Process [event] for [client]") or
  automatically via integration event.
inputs:
  - client_id or client_name (string, required)
  - event_type (string, required — e.g. "document_signed", "milestone_reached", "transaction_closed")
  - event_details (string or object, required — description or structured data about the event)
  - project_id (string, optional — if the event is project-specific)
outputs:
  - activity_log entry for the event
  - updated records (client, project, task as applicable)
  - follow-up tasks created
  - team notification sent
tools:
  - mcp: create_task, update_client, update_project, upload_document, notify_team, log_activity
verification:
  - Event logged in activity_log with all details
  - Relevant records updated to reflect the event
  - Follow-up tasks created with correct assignees and due dates
  - Team notified of the event
  - No orphaned or inconsistent records
---

# Task / Workflow Processing SOP

## Purpose

Standardize the handling of operational events that require updates across
multiple records, follow-up tasks, and team notifications. Replaces the
manual process of toggling between systems, copying data, and emailing
team members.

---

## Step-by-Step Instructions

### Step 1: Log the Event

Immediately create an `activity_log` entry to capture the event:

- actor_type: determined by trigger (user if manual, system if event-driven)
- action: `event_type` value (e.g., "document_signed")
- entity_type: `client` (or `project` if project-specific)
- entity_id: `client_id` or `project_id`
- details: full `event_details` as JSON

This ensures the event is recorded even if subsequent steps fail.

### Step 2: Validate Inputs

- Resolve the client (by id or name search).
- If `project_id` is provided, verify the project exists and belongs to the
  client.
- Validate that `event_type` is a recognized type. If not, proceed but flag
  it as an unrecognized event type in the log.
- Confirm `event_details` contains enough information to act on.

### Step 3: Determine Required Actions

Based on `event_type`, determine what needs to happen. Common patterns:

| Event Type           | Record Updates                  | Follow-Up Tasks                      |
|---------------------|---------------------------------|--------------------------------------|
| document_signed     | Update task status to done      | File document, notify team           |
| milestone_reached   | Update project status/metadata  | Schedule review, create next phase   |
| transaction_closed  | Update project, log financials  | Send confirmation, create archive    |
| request_received    | Create or update task           | Assign to team member, set deadline  |
| status_change       | Update entity status            | Notify stakeholders                  |

If the event type doesn't match a known pattern, treat it as a generic
update: log it, create a follow-up review task, and notify the team.

### Step 4: Update Records

Execute the record updates determined in Step 3:

- Update client metadata if the event changes client state.
- Update project status or metadata if project-specific.
- Mark tasks as completed if the event fulfills them.
- Upload or link any associated documents.

### Step 5: Create Follow-Up Tasks

For each follow-up action identified:

- Create a task linked to the client and project (if applicable).
- Set an appropriate priority based on urgency.
- Set due dates relative to today (default +3 days for standard follow-ups,
  +1 day for urgent).
- Assign to the relevant team member if identifiable.

### Step 6: Notify Team

Send a notification to the appropriate team member(s) or channel:

> "{event_type} processed for {client_name}: {brief description}.
> {N} follow-up tasks created."

### Step 7: Final Activity Log

If additional records were created or modified beyond the initial log entry,
create supplementary activity entries for each significant change. This
ensures the full audit trail is complete.

### Step 8: Report Back

If triggered manually, return a summary:

> "Processed {event_type} for {client_name}:
> - Records updated: {list}
> - {N} follow-up tasks created
> - Team notified"

If triggered by an event/automation, log the completion and exit silently.

---

## Edge Cases

- **Unknown event type:** Process as generic. Log everything, create a
  review task for a team member to classify and handle manually.
- **Event for inactive client:** Proceed with processing but flag: "Note:
  this client's status is inactive. Should they be reactivated?"
- **Duplicate event:** Check if an identical event was logged within the
  last 5 minutes. If so, skip and report: "Duplicate event detected, skipping."
- **Missing project context:** If the event seems project-specific but no
  project_id is provided, attempt to infer from the client's active projects.
  If ambiguous, ask for clarification (manual) or assign to the most recent
  active project (automated).
- **Cascading failures:** If a record update fails, do NOT stop. Continue
  with remaining steps and report all failures at the end.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
