---
title: Review / Meeting Preparation
category: operations
trigger: manual
description: >
  Prepares a comprehensive briefing package for a client review or meeting.
  Pulls profile, recent activity, open tasks, meeting history, project
  statuses, and compiles everything into a structured briefing document.
  Triggered when a team member says "Prep for [client] review".
inputs:
  - client_id or client_name (string, required)
  - review_type (string, optional — e.g. "quarterly", "check-in", "annual". Defaults to "review")
  - date_range_days (integer, optional — how far back to look. Defaults to 90)
outputs:
  - briefing document (structured markdown)
  - activity_log entry
tools:
  - mcp: get_client, list_projects, list_tasks, search_notes, list_documents, get_activity_feed, generate_report, log_activity
verification:
  - Briefing document generated with all sections populated
  - Data is current (pulled from live database state, not cached)
  - Activity log entry created with action=review_prepared
---

# Review / Meeting Preparation SOP

## Purpose

Eliminate the 30-60 minutes of manual data gathering before a client review.
The agent assembles a complete briefing package from all data sources so the
team member only needs to review and add personal notes.

---

## Step-by-Step Instructions

### Step 1: Resolve Client

- Resolve the client by `client_id` or search by `client_name`.
- If ambiguous, ask for clarification.
- Fetch the full client record including metadata.

### Step 2: Pull Client Profile

Gather the client's core information:

- Name, email, phone, status
- Account age (time since `created_at`)
- Any metadata fields (goals, preferences, notes from previous interactions)

### Step 3: Gather Recent Activity

Query `activity_log` for entries related to this client within the
`date_range_days` window:

- Filter by `entity_type='client'` and `entity_id=client_id`
- Also gather activity for the client's projects and tasks
- Sort by date descending
- Group by week for readability

### Step 4: List Open Tasks

Query all tasks linked to the client:

- Separate into: overdue, due this week, due later, no due date
- Include task title, status, priority, assignee, due date
- Flag any tasks that have been in "in_progress" for more than 14 days

### Step 5: Pull Meeting History

Query notes where `client_id` matches and `type` is `meeting_transcript`:

- Within the `date_range_days` window
- For each meeting: date, source, summary (first 200 chars or metadata.title)
- Count total meetings in the period

### Step 6: Compile Project Statuses

Query all projects linked to the client:

- For each project: name, status, start_date, end_date, budget
- Count of open vs completed tasks per project
- Flag any projects past their end_date that aren't completed

### Step 7: Pull Relevant Documents

Query documents linked to the client:

- Recently uploaded or modified within the date range
- Name, type, upload date

### Step 8: Generate Briefing Document

Assemble all gathered data into a structured briefing:

```
# Client Review Briefing — {client_name}
## Prepared: {date} | Review Type: {review_type}

---

### Client Profile
- Name: {name}
- Email: {email}
- Status: {status}
- Client since: {date}

### Account Summary
- Active projects: {N}
- Open tasks: {N} ({overdue} overdue)
- Meetings in period: {N}
- Documents: {N}

### Project Status
[table of projects with status, task counts, timeline]

### Open Tasks
#### Overdue
[list]
#### Due This Week
[list]
#### Upcoming
[list]

### Recent Meetings
[list with dates and summaries]

### Recent Activity
[grouped by week]

### Recent Documents
[list]

### Suggested Discussion Points
- [auto-generated based on overdue items, stale projects, recent activity]
```

### Step 9: Log Activity

Create an `activity_log` entry:

- actor_type: `mcp-agent`
- action: `review_prepared`
- entity_type: `client`
- entity_id: `client_id`
- details: `{ "review_type": "<type>", "date_range_days": <N> }`

### Step 10: Report Back

Present the briefing to the team member. Offer to:

- Export as a document (PDF or markdown file)
- Create tasks for any suggested action items
- Schedule the review meeting if not already scheduled

---

## Edge Cases

- **New client with little data:** Generate the briefing with whatever is
  available. Note the sparse sections rather than omitting them.
- **Very active client (hundreds of entries):** Summarize rather than
  listing everything. Focus on the most recent and most significant items.
- **No meetings in period:** Note this — it may itself be a discussion point.
- **Client has multiple projects:** Include all of them. Group tasks by project.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
