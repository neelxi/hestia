# Hestia Portal — Functionality Map

A comprehensive mapping of Hestia schema tables to portal functionality for team, client, and admin users.

---

## Schema Overview

### Core Tables (001_initial_schema.sql)
| Table | Purpose |
|-------|---------|
| `workspace` | Single workspace config (name, type, template_id, settings) |
| `profiles` | User profiles linked to auth.users (role: admin/team/client) |
| `clients` | Client/brokerage records |
| `projects` | Engagements linked to clients |
| `tasks` | Tasks linked to projects and/or clients |
| `documents` | Files (client/project-scoped) |
| `notes` | Notes, meeting transcripts, emails, calls |
| `directives` | SOP library |
| `directive_runs` | Execution history of directives |
| `activity_log` | Audit trail of actions |
| `integration_providers` | Registry of connectable tools |
| `integrations` | Connected integrations |
| `integration_events` | Incoming webhook/API events |
| `field_mappings` | Integration field mappings |

### Sales Pipeline (003_hestia_sales_pipeline.sql)
| Table | Purpose |
|-------|---------|
| `clients` (extended) | + owner_name, location, size_agents, annual_gci |
| `cold_email_campaigns` | Smartlead/cold email campaign metrics |
| `warm_leads` | Lead magnet + cold email respondents |
| `cold_campaign_recipients` | Per-recipient open/reply tracking |

### Applications (006_applications_table.sql)
| Table | Purpose |
|-------|---------|
| `applications` | Lead form submissions from marketing site |

---

## Role-Based Access (RLS Summary)

| Role | Access |
|------|--------|
| **Admin** | Full CRUD on workspace, profiles, directives, integrations, field_mappings |
| **Team** | Read/write clients, projects, tasks, documents, notes; read directives, directive_runs, activity, integrations; read/write warm_leads, cold_campaigns, cold_campaign_recipients |
| **Client** | Read-only on own client, projects, tasks, documents, notes (matched by email) |
| **anon** | Insert only: applications, warm_leads (public forms) |

---

## Team Portal — Functionality Map

### 1. Dashboard (`/team/dashboard`)
| Data Source | Current | Recommended |
|-------------|---------|-------------|
| `clients` (count) | ✅ | |
| `projects` (active count) | ✅ | |
| `tasks` (open count) | ✅ | |
| `activity_log` (recent) | ✅ | Add link to entity detail |
| `tasks` (upcoming) | ✅ | Add link to task detail |
| `warm_leads` (new count) | ❌ | Add for Hestia pipeline |
| `applications` (unread count) | ❌ | Add for Hestia pipeline |
| `directive_runs` (recent failed) | ❌ | Add for admin awareness |

**Hestia template** (`ownerDashboard.modules`): revenue, clientCount, taskCompletion, activeEngagements.

---

### 2. Clients (`/team/clients`)
| Table | List | Detail | Create | Edit | Delete |
|------|------|--------|--------|------|--------|
| `clients` | ✅ | ✅ | ❌ | ❌ | ❌ |

**Extend:**
- **Create** (`/team/clients/new`): Form for name, email, phone, status, owner_name, location, size_agents, annual_gci, metadata.
- **Edit** (`/team/clients/[id]/edit`): Same fields.
- **Delete**: Soft delete or archive (status → inactive).
- **Search**: Already supports name/email; add status filter.
- **Client detail**: Add link to project create; link to convert from warm_lead.

---

### 3. Projects (Engagements) (`/team/projects`)
| Table | List | Detail | Create | Edit | Delete |
|------|------|--------|--------|------|--------|
| `projects` | ✅ | ❌ | ❌ | ❌ | ❌ |

**Extend:**
- **Create** (`/team/projects/new`): client_id, name, description, status, start_date, end_date, budget.
- **Detail** (`/team/projects/[id]`): Project header + tabs for tasks, documents, notes (like client detail).
- **Edit** (`/team/projects/[id]/edit`): Same fields.
- **Status**: Use Hestia workflow: discovery, implementation, active, on_hold, completed, archived.
- **Project list**: Add link to project detail (currently links to client).

---

### 4. Tasks (`/team/tasks`)
| Table | List | Detail | Create | Edit | Status Update |
|------|------|--------|--------|------|---------------|
| `tasks` | ✅ | ❌ | ❌ | ❌ | ❌ |

**Extend:**
- **Create** (`/team/tasks/new`): project_id, client_id, title, description, status, priority, assignee_id, due_date.
- **Detail** (`/team/tasks/[id]`): Full task view + related notes/documents.
- **Edit** (`/team/tasks/[id]/edit`): Same fields.
- **Status update**: Kanban-style drag or inline status change (todo → in_progress → review → done).
- **Assignee**: Dropdown from profiles.
- **Filter**: By project, client, assignee, status, priority.

---

### 5. Documents
| Table | Team View | Client View | Upload | Download |
|------|-----------|-------------|--------|----------|
| `documents` | In client detail tab | ✅ | ❌ | ❌ (client has link but file_path may be storage path) |

**Extend:**
- **Team upload**: From client detail or project detail; use Supabase Storage, store `file_path` (bucket/key).
- **Download**: Resolve signed URL from Supabase Storage for `file_path`.
- **Standalone list** (`/team/documents`): Optional; filter by client/project.
- **Delete**: Admin/team only.

---

### 6. Notes
| Table | Team View | Client View | Create | Edit |
|------|-----------|-------------|--------|------|
| `notes` | In client detail tab | Via meetings page | ❌ | ❌ |

**Extend:**
- **Create** (`/team/notes/new`): client_id, project_id, type (note, meeting_transcript, email, call), content, source, metadata.
- **Edit** (`/team/notes/[id]/edit`): Edit content.
- **Meeting transcript**: Often created by integration; team can add manual notes.

---

### 7. Directives (`/team/directives`)
| Table | List | Detail | Create | Edit | Run |
|------|------|--------|--------|------|-----|
| `directives` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `directive_runs` | ✅ (recent) | ❌ | — | — | — |

**Extend:**
- **Detail** (`/team/directives/[id]`): Full content (markdown), category, is_automated, trigger_conditions.
- **Create** (`/team/directives/new`): Admin only; title, content, category, is_automated, trigger_conditions.
- **Edit** (`/team/directives/[id]/edit`): Admin only.
- **Runs**: Detail page for run (input, output, status, error); filter by directive, status.

---

### 8. Activity (`/team/activity`)
| Table | List | Filter | Entity Link |
|------|------|--------|-------------|
| `activity_log` | ✅ | ❌ | ❌ |

**Extend:**
- **Filter**: By entity_type, actor_type, date range.
- **Entity link**: Click action → navigate to `/team/clients/[id]`, `/team/projects/[id]`, etc. when entity_id present.
- **Pagination**: Beyond 50.

---

### 9. Applications (`/team/applications`)
| Table | List | Detail | Status | Convert |
|------|------|--------|--------|---------|
| `applications` | ✅ | ✅ | ❌ | ❌ |

**Extend:**
- **Status**: Add `status` column to schema (optional) or track in warm_leads after conversion.
- **Convert to warm_lead**: Button to create warm_lead from application; link or merge.
- **Convert to client**: Create client from application; optionally create project.
- **Search**: Already supports name, email, brokerage.

---

### 10. Leads (Warm Leads) (`/team/leads`)
| Table | List | Detail | Status | Assignee | Convert |
|------|------|--------|--------|----------|---------|
| `warm_leads` | ✅ | ✅ | ❌ | ❌ | ❌ |

**Extend:**
- **Status update**: Dropdown (new, contacted, qualified, proposal_sent, converted, lost).
- **Assignee**: Dropdown from profiles.
- **Convert to client**: Create client from warm_lead; set converted_to_client_id, converted_at.
- **Notes**: Add/edit notes field.
- **Cold campaign link**: Show cold_campaign_id, cold_recipient_id if present.

---

### 11. Cold Email Campaigns
| Table | List | Detail | Create | Sync |
|------|------|--------|--------|------|
| `cold_email_campaigns` | ❌ | ❌ | ❌ | ❌ |
| `cold_campaign_recipients` | ❌ | ❌ | — | — |

**Extend:**
- **List** (`/team/campaigns`): cold_email_campaigns with sent_count, opened_count, response_count, open_rate, response_rate.
- **Detail** (`/team/campaigns/[id]`): Campaign metrics + link to warm_leads from recipients who replied.
- **Create**: Manual or via Smartlead integration.
- **Recipients**: List recipients with opened_at, replied_at; link to warm_lead.

---

### 12. Metrics (`/team/metrics`)
| Data Source | Current | Recommended |
|-------------|---------|-------------|
| `clients` (count) | ✅ | |
| `projects` (active) | ✅ | |
| `tasks` (completed this month) | ✅ | |
| `profiles` (count) | ✅ | |
| `projects` (by status) | ❌ | Chart: status distribution |
| `tasks` (by status over time) | ❌ | Chart: completion trend |
| `clients` (annual_gci) | ❌ | Revenue chart if populated |
| `directive_runs` (success/fail rate) | ❌ | Automation health |

**Hestia template** (`ownerDashboard.modules`): revenue, clientCount, taskCompletion, activeEngagements.

---

### 13. Financial (`/team/financial`)
| Data Source | Current | Recommended |
|-------------|---------|-------------|
| `clients` (annual_gci) | ❌ | Aggregate revenue |
| `projects` (budget) | ❌ | Budget vs actual (placeholder) |
| Invoices | ❌ | No table yet; future |

**Current**: Placeholder. **Recommended**: Use `clients.annual_gci` and `projects.budget` for basic revenue/engagement metrics until invoicing is added.

---

### 14. Capacity (`/team/capacity`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `profiles` | ✅ | |
| `tasks` (by assignee) | ✅ | Add filter by project/client |
| Overdue | ✅ | |

**Extend**: Filter by project, client; chart by workload over time.

---

## Client Portal — Functionality Map

### 1. Dashboard (`/client/dashboard`)
| Data Source | Current | Recommended |
|-------------|---------|-------------|
| `clients` (by email) | ✅ | |
| `projects` (active count) | ✅ | |
| `tasks` (open count) | ✅ | |
| `documents` (count) | ✅ | |
| `notes` (meeting_transcript count) | ✅ | |
| `tasks` (upcoming) | ✅ | |
| `activity_log` (recent) | ✅ | |

**Hestia terminology**: "Account" = project; "Meetings" = notes with type meeting_transcript.

---

### 2. Accounts (`/client/accounts`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `projects` | ✅ (as cards) | Add link to project detail |

---

### 3. Projects (`/client/projects`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `projects` | ✅ | |
| `tasks` (by project) | ✅ | Add task detail view (read-only) |

---

### 4. Documents (`/client/documents`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `documents` | ✅ | Ensure download works (signed URL) |

---

### 5. Meetings (`/client/meetings`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `notes` (type=meeting_transcript) | ✅ | Add expand for full transcript |

---

## Admin Portal — Functionality Map

### 1. Integrations (`/admin/integrations`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `integration_providers` | ✅ | |
| `integrations` | ✅ | Add connect/disconnect flow |

**Extend:**
- **Connect**: Form for credential (encrypted), webhook_secret.
- **Integration events** (`/admin/integrations/[id]/events`): List integration_events with processed_status, error_message; retry failed.
- **Field mappings**: CRUD for field_mappings per integration.

---

### 2. Users (`/admin/users`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `profiles` | ✅ | Role change, link to auth |

**Extend**: Create invite, deactivate user.

---

### 3. Settings (`/admin/settings`)
| Table | Current | Recommended |
|-------|---------|-------------|
| `workspace` | ❌ | Edit name, settings (JSON), template_id |

---

### 4. Templates (`/admin/templates`)
| Purpose | Current | Recommended |
|---------|---------|-------------|
| Template config | ✅ | Read-only; template drives terminology |

---

## Summary: Priority Matrix

### High priority (core CRUD)
| Area | Missing | Action |
|------|----------|--------|
| Clients | Create, Edit | Add forms |
| Projects | Detail, Create, Edit | Add pages |
| Tasks | Detail, Create, Edit, Status | Add pages + inline status |
| Documents | Upload, Download | Storage integration |

### Medium priority (sales pipeline)
| Area | Missing | Action |
|------|----------|--------|
| Warm leads | Status, Assignee, Convert | Add to lead detail |
| Applications | Convert to lead/client | Add actions |
| Cold campaigns | List, Detail | New section |

### Medium priority (operational)
| Area | Missing | Action |
|------|----------|--------|
| Directives | Detail, Create, Edit | Admin only |
| Notes | Create, Edit | Add forms |
| Activity | Filter, Entity link | Enhance |
| Financial | Real data | Use clients.annual_gci, projects.budget |

### Lower priority
| Area | Missing | Action |
|------|----------|--------|
| Integration events | List, Retry | Admin integrations detail |
| Workspace | Admin edit | Settings page |
| Field mappings | CRUD | Admin integrations |

---

## Hestia Terminology (from templates/hestia.json)

| Generic | Hestia |
|---------|--------|
| Client | Brokerage |
| Clients | Brokerages |
| Project | Engagement |
| Projects | Engagements |
| Account (client portal) | Account |
| Meetings | Meetings |
| Revenue | Revenue |

Use these labels in the UI when `NEXT_PUBLIC_PORTAL_MODE=hestia` and template is hestia.
