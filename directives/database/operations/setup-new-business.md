---
title: Setup New Business
category: operations
trigger: manual
description: >
  Bootstraps a new workspace in Hestia. Creates the workspace record,
  applies a template (brokerage, hestia, agency, etc.), and seeds default
  directives. Run once per new deployment (Hestia or client).
inputs:
  - company_name (string, required)
  - template_id (string, required — one of: brokerage, hestia, agency, professional-services, base)
  - company_type (string, optional — overrides template default)
outputs:
  - workspace record in Supabase
  - directives seeded from template's defaultDirectives
  - activity_log entry
tools:
  - execution/operations/setup_company.py
verification:
  - Workspace exists in workspace table with correct template_id and settings
  - Directives exist in directives table
  - Activity log entry created with action=workspace_setup
---

# Setup New Business SOP

## Purpose

One-command setup for a new deployment (client or Hestia). Creates the
workspace, applies the appropriate template, and seeds the default SOPs so the
system is ready for the first user.

---

## Step-by-Step Instructions

### Step 1: Validate Prerequisites

- Supabase is running (local: `supabase start`, or remote project configured)
- `.env` contains `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`
- Python execution environment has dependencies installed:
  `cd execution && pip install -r requirements.txt`

### Step 2: Run Setup Script

**Option A: Shell script (recommended)**

```bash
./scripts/setup_new_business.sh "Workspace Name" template_id
```

Examples:
- New brokerage client: `./scripts/setup_new_business.sh "Acme Realty" brokerage`
- Hestia: `./scripts/setup_new_business.sh "Hestia" hestia`

**Option B: Python directly**

```bash
python -m execution.operations.setup_company --name "Workspace Name" --template brokerage
```

Use `--dry-run` to preview without creating.

### Step 3: Capture Output

The script outputs:
- `workspace_id` — UUID of the created workspace
- `directives_seeded` — count of directives created
- `next_steps` — follow-up actions

### Step 4: First User Signup

- Sign up at the portal with display name, email, and password
- First user becomes admin; subsequent users become team by default

---

## Templates

| Template ID | Use Case |
|-------------|----------|
| brokerage | Real estate brokerages (clients) |
| hestia | Hestia (infrastructure provider) |
| agency | Creative/marketing agencies |
| professional-services | RIAs, consultancies |
| base | Generic fallback |

---

## Edge Cases

- **Re-running setup:** The script replaces the existing workspace and directives. Use with care on deployments with data.
- **Missing directive files:** All templates now have corresponding directive files. If you add a new template directive, add the mapping in `DIRECTIVE_SLUG_TO_PATH` in `setup_company.py`.
- **Empty database:** Run setup_company first, then sign up the first user at the portal.

---

## Learnings

_Updated as the system encounters errors and discovers solutions._

- (none yet)
