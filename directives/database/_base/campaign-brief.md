---
title: Campaign Brief
category: operations
trigger: manual
description: >
  Creates a campaign brief for a new client engagement. Captures objectives,
  scope, deliverables, timeline, and success criteria. Used by agencies when
  kicking off a new campaign or project.
inputs:
  - client_id or client_name (string, required)
  - campaign_name (string, required)
  - objectives (string, optional — campaign goals)
  - timeline (string, optional — key dates)
outputs:
  - campaign brief document (note or document)
  - project record linked to client
  - activity_log entry
tools:
  - mcp: get_client, create_project, create_note, create_task, log_activity
verification:
  - Brief captured and linked to client
  - Project created with status=active
  - Activity log entry created
---

# Campaign Brief SOP

## Purpose

Standardize how agencies capture and document new campaign kickoffs. Ensures objectives, scope, and timeline are captured before work begins.

## Step-by-Step Instructions

1. Look up the client by name or ID.
2. Create a project (campaign) linked to the client.
3. Capture the brief: objectives, scope, deliverables, timeline.
4. Create a note of type "campaign_brief" with the content.
5. Create initial tasks for the campaign if specified.
6. Log the campaign kickoff to the activity trail.
