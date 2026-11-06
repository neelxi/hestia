---
title: Deliverable Review
category: operations
trigger: manual
description: >
  Reviews a deliverable before client handoff. Checks completeness, quality
  gates, and creates any follow-up tasks. Used by agencies when a deliverable
  is ready for client review.
inputs:
  - project_id or project_name (string, required)
  - deliverable_name (string, required)
  - checklist_items (array, optional — custom quality gates)
outputs:
  - review summary (note)
  - tasks for any gaps
  - activity_log entry
tools:
  - mcp: get_project, list_tasks, create_note, create_task, update_task_status, log_activity
verification:
  - Review note created and linked to project
  - Gaps have follow-up tasks
  - Activity log entry created
---

# Deliverable Review SOP

## Purpose

Ensure deliverables meet quality standards before client handoff. Reduces rework and ensures nothing is missed.

## Step-by-Step Instructions

1. Look up the project by name or ID.
2. Review the deliverable against standard quality gates (completeness, formatting, client requirements).
3. Create a review note documenting pass/fail for each gate.
4. Create tasks for any items that need attention.
5. Update project/deliverable status as appropriate.
6. Log the deliverable review to the activity trail.
