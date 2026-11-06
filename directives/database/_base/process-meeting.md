---
title: Process Meeting
category: operations
trigger: manual
description: >
  Processes a meeting transcript: stores it as a note, extracts discussion
  points and action items, creates tasks, updates the client record, generates
  a summary, and logs all activity. Triggered when a team member says
  "Process meeting for [client]".
inputs:
  - client_id or client_name (string, required — identifies the client)
  - transcript_text (string, required if not fetching from integration)
  - source (string, optional — e.g. "manual" or the slug of a connected integration. Defaults to "manual")
  - meeting_date (string, optional — ISO date. Defaults to today)
outputs:
  - note record (type=meeting_transcript) with full transcript
  - list of extracted action items with owners and due dates
  - task records for each action item
  - client record updated with any new information
  - activity_log entry
tools:
  - execution/operations/process_meeting.py
  - mcp: create_note, create_task, update_client, get_meeting_transcript, log_activity
verification:
  - Note record exists with type=meeting_transcript and correct client_id
  - All action items extracted and created as tasks with assignees and due dates
  - Client record updated if new info was discussed
  - Activity log entry created with action=meeting_processed
---

# Process Meeting SOP

## Purpose

Eliminate the 30-45 minutes of post-meeting administrative work per meeting.
The agent processes the transcript, extracts every action item, creates tasks,
and generates a client-ready summary — turning a 30-minute chore into a
2-minute review.

---

## Step-by-Step Instructions

### Step 1: Resolve Client

- If `client_id` is provided, fetch the client record to confirm it exists.
- If `client_name` is provided instead, search clients by name. If multiple
  matches, ask the team member to clarify.
- If no client can be resolved, STOP and ask for clarification.

### Step 2: Retrieve Transcript

- If `transcript_text` is provided directly, use it.
- If not, check if a meeting recorder integration is connected. Use `get_meeting_transcript` to pull the most recent
  transcript for this client.
- If no transcript can be found, STOP and ask the team member to provide the
  text or check the recording tool.

### Step 3: Store the Transcript

Run `execution/operations/process_meeting.py` with `client_id` and
`transcript_text`, OR use the MCP `create_note` tool:

- client_id: resolved client id
- type: `meeting_transcript`
- source: provided source or `manual`
- content: full transcript text
- metadata: `{ "meeting_date": "<date>", "processed_at": "<timestamp>" }`

Capture the returned `note_id`.

### Step 4: Extract Discussion Points

Analyze the transcript and extract:

1. **Key discussion topics** — The major subjects covered.
2. **Decisions made** — Any commitments or agreements.
3. **New information** — Client details mentioned that may not be in the
   system (e.g., new contact info, changed circumstances, new goals).
4. **Action items** — Every follow-up task with:
   - Description of what needs to be done
   - Who is responsible (team member name or "client")
   - Suggested due date (based on urgency discussed, default +7 days)
   - Priority (urgent/high/medium/low based on context)

### Step 5: Create Tasks for Action Items

For each extracted action item:

- Create a task linked to the client (and project if identifiable)
- Set title, description, priority, and due_date from the extraction
- If an assignee name is recognized as a team member, set `assignee_id`
- If the action item is for the client, note that in the task description
  but leave assignee null

### Step 6: Update Client Record

If Step 4 identified new information about the client (phone number, email
change, new metadata like goals or preferences), update the client record
accordingly. Use `update_client` or direct Supabase update.

### Step 7: Generate Summary

Compose a clean meeting summary structured as:

```
## Meeting Summary — {client_name} — {date}

### Discussion Points
- [bullet list]

### Decisions
- [bullet list]

### Action Items
| # | Item | Owner | Due |
|---|------|-------|-----|
| 1 | ...  | ...   | ... |

### Notes
[any additional context]
```

Present this summary to the team member for review before sending to the
client.

### Step 8: Log Activity

Create an `activity_log` entry:

- actor_type: `mcp-agent`
- action: `meeting_processed`
- entity_type: `note`
- entity_id: `note_id`
- details: `{ "client_id": "<id>", "action_items_count": <N>, "tasks_created": <N> }`

### Step 9: Report Back

Return the summary and a status report:

> "Meeting processed for {client_name}:
> - Transcript stored (note {note_id})
> - {N} action items extracted
> - {N} tasks created
> - Client record updated: {yes/no}
>
> [Full summary below for your review]"

---

## Edge Cases

- **Garbled or very short transcript:** Warn the team member that the
  transcript quality may be low. Process what you can and flag sections that
  are unclear.
- **No clear action items:** It's valid for a meeting to have no action items.
  Note that in the summary rather than fabricating tasks.
- **Multiple clients in one meeting:** Ask the team member which client to
  file it under. If both, create the note for the primary client and
  cross-reference in the metadata.
- **Transcript too long:** Process in sections. Supabase `text` columns have
  no practical limit, but summarization should chunk if needed.
- **Integration fetch failure:** If the recording tool API fails, log the
  error and ask the team member to paste the transcript manually.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
