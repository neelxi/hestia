---
title: Compliance Checklist
category: operations
trigger: manual or schedule
description: >
  Runs a compliance review checklist for the firm. Verifies documentation,
  audit trail completeness, and regulatory requirements. Used by professional
  services firms (RIAs, consultancies) to ensure process adherence.
inputs:
  - period_start (string, optional — ISO date)
  - period_end (string, optional — ISO date)
  - focus (string, optional — "documents", "audit_trail", "all". Defaults to "all")
outputs:
  - compliance checklist report
  - remediation tasks for gaps
  - activity_log entry
tools:
  - mcp: list_directives, list_clients, list_tasks, get_activity_feed, create_task, log_activity
verification:
  - Report covers specified period
  - Gaps have remediation tasks
  - Activity log entry created
---

# Compliance Checklist SOP

## Purpose

Ensure the firm meets compliance requirements: document retention, audit trail completeness, and process adherence. Run periodically or before audits.

## Step-by-Step Instructions

1. Define the review period (default: last quarter).
2. Pull activity log and verify completeness for the period.
3. Check for unsigned agreements, missing documents, or incomplete workflows.
4. Generate a checklist report with pass/fail for each item.
5. Create remediation tasks for any gaps.
6. Log the compliance review to the activity trail.
