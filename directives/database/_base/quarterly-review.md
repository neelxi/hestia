---
title: Quarterly Review / Periodic Audit
category: operations
trigger: schedule (quarterly) or manual
schedule: "0 9 1 */3 *"
description: >
  Comprehensive review of the past quarter's operations. Reviews the activity
  log, checks for incomplete items, verifies process compliance, generates a
  summary report, and creates remediation tasks for anything that needs
  attention. Run automatically at the start of each quarter or manually via
  "Run the quarterly review".
inputs:
  - period_start (string, optional — ISO date. Defaults to 90 days ago)
  - period_end (string, optional — ISO date. Defaults to today)
  - focus_area (string, optional — e.g. "compliance", "operations", "all". Defaults to "all")
outputs:
  - quarterly review report (structured markdown)
  - remediation tasks for flagged items
  - activity_log entry
tools:
  - mcp: get_activity_feed, search_everything, list_tasks, list_projects, list_clients, generate_report, create_task, log_activity
verification:
  - Report covers the full specified period with no gaps
  - All flagged items have corresponding remediation tasks
  - Report is factual (derived from database, not hallucinated)
  - Activity log entry created with action=quarterly_review_completed
---

# Quarterly Review / Periodic Audit SOP

## Purpose

Replace the 4-6 hours of manual review work at the end of each quarter.
The agent audits the entire period's operations, flags issues, and generates
a report that a reviewer can approve in 30 minutes.

---

## Step-by-Step Instructions

### Step 1: Determine Review Period

- If `period_start` and `period_end` are provided, use them.
- Otherwise default to the last 90 days (approximately one quarter).
- Log the review period for the report header.

### Step 2: Review Activity Log

Query `activity_log` for the entire review period:

- Count total activities by type (actor_type, action).
- Identify the most active days and any gaps (days with zero activity may
  indicate system issues or holidays).
- Group by entity_type to see which areas had the most activity.

Generate a summary table:

| Metric                    | Count |
|--------------------------|-------|
| Total activities logged  | N     |
| Client-related           | N     |
| Project-related          | N     |
| Task-related             | N     |
| Agent-initiated          | N     |
| User-initiated           | N     |
| Days with zero activity  | N     |

### Step 3: Check for Incomplete Items

Query for items that should have been completed but weren't:

- **Overdue tasks:** Tasks with `due_date` before `period_end` and status
  not in ("done", "completed"). Group by client and priority.
- **Stale in-progress tasks:** Tasks with status "in_progress" that haven't
  been updated in 30+ days.
- **Projects past end date:** Projects where `end_date` < `period_end` but
  status is still "active".
- **Unprocessed meetings:** Notes of type "meeting_transcript" that don't
  have corresponding tasks created within 3 days of the meeting.

### Step 4: Verify Process Compliance

Check that standard operating procedures were followed:

- **Client onboarding:** For each new client created in the period, verify
  that a project and onboarding tasks exist.
- **Meeting processing:** For each meeting transcript, verify that action
  items were extracted (check for tasks created within a reasonable window).
- **Activity logging:** Verify that significant events (new clients, closed
  projects, etc.) have corresponding activity_log entries.

Flag any gaps as compliance issues.

### Step 5: Client Health Check

For each active client:

- Last interaction date (most recent activity_log entry or note).
- Flag clients with no activity in 30+ days as "at risk of going cold."
- Count of open tasks and overdue tasks.
- Number of meetings in the period.

### Step 6: Generate Summary Report

Compile all findings into a structured report:

```
# Quarterly Review Report
## Period: {start_date} — {end_date}
## Generated: {today}

---

### Executive Summary
[2-3 sentence overview of the quarter's operations health]

### Activity Overview
[summary table from Step 2]

### Incomplete Items ({count})
#### Overdue Tasks ({count})
[table: task, client, priority, days overdue]

#### Stale Tasks ({count})
[table: task, client, last updated, days stagnant]

#### Projects Past Deadline ({count})
[table: project, client, end_date, days past]

### Process Compliance
#### Onboarding Compliance
- Clients onboarded: {N}
- Fully compliant: {N}
- Issues found: {N}
[details of any gaps]

#### Meeting Processing Compliance
- Meetings recorded: {N}
- Properly processed: {N}
- Missing follow-ups: {N}
[details of any gaps]

### Client Health
| Client | Status | Last Activity | Open Tasks | Overdue | Meetings |
|--------|--------|---------------|------------|---------|----------|
| ...    | ...    | ...           | ...        | ...     | ...      |

[flag at-risk clients]

### Recommended Actions
[numbered list of suggested remediation items]
```

### Step 7: Create Remediation Tasks

For each flagged issue that requires action:

- Create a task with a clear title describing the remediation needed.
- Set priority based on severity (overdue compliance = high, stale task = medium).
- Set due_date to +7 days (or sooner for urgent items).
- Assign to the relevant team member if identifiable, otherwise leave
  unassigned for the reviewer to triage.
- Link to the relevant client/project.

### Step 8: Log Activity

Create an `activity_log` entry:

- actor_type: `mcp-agent`
- action: `quarterly_review_completed`
- entity_type: `directive`
- entity_id: null
- details: `{ "period_start": "<date>", "period_end": "<date>", "issues_found": <N>, "remediation_tasks_created": <N> }`

### Step 9: Report Back

Present the report to the team member (or save as a document if running
on schedule). Include:

> "Quarterly review complete for {period}:
> - {N} total activities reviewed
> - {N} issues flagged
> - {N} remediation tasks created
>
> [Full report attached / below]"

---

## Edge Cases

- **Very new company (< 1 quarter of data):** Run the review on whatever
  data exists. Note the limited period in the report.
- **No issues found:** This is a valid outcome. Generate the report with
  a clean bill of health.
- **Massive activity volume (10,000+ entries):** Summarize rather than
  listing every entry. Focus on aggregates and outliers.
- **Missing compliance benchmarks:** If template-specific compliance checks
  aren't configured yet, skip those sections and note they should be set up.
- **Scheduled run with no reviewer:** Generate the report and save it as a
  document in the system. Create a task: "Review quarterly report for {period}"
  assigned to an admin.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
