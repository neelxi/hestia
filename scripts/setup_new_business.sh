#!/usr/bin/env bash
# Setup a new workspace in Hestia.
#
# Usage:
#   ./scripts/setup_new_business.sh "Acme Brokerage" brokerage
#   ./scripts/setup_new_business.sh "Hestia" hestia
#
# Prerequisites:
#   - Supabase running (local: supabase start, or remote project)
#   - .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
#   - Python 3.10+ with execution/ deps: python3 -m venv .venv && source .venv/bin/activate && pip install -r execution/requirements.txt

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXECUTION_DIR="$REPO_ROOT/execution"

COMPANY_NAME="${1:?Usage: $0 <company_name> <template>}"
TEMPLATE="${2:?Usage: $0 <company_name> <template>}"

# Validate template
VALID_TEMPLATES="base agency professional-services brokerage hestia"
if ! echo "$VALID_TEMPLATES" | grep -qw "$TEMPLATE"; then
  echo "Error: template must be one of: $VALID_TEMPLATES"
  exit 1
fi

# Load .env from repo root
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
elif [ -f "$REPO_ROOT/portal/.env.local" ]; then
  set -a
  source "$REPO_ROOT/portal/.env.local"
  set +a
fi

# SUPABASE_URL can come from NEXT_PUBLIC_SUPABASE_URL (common in .env)
if [ -z "$SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  export SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set (in .env or environment)"
  exit 1
fi

echo "=== Hestia: Setup New Business ==="
echo "Workspace: $COMPANY_NAME"
echo "Template: $TEMPLATE"
echo ""

# Ensure migrations are applied (Supabase CLI)
if command -v supabase &>/dev/null; then
  cd "$REPO_ROOT"
  if [ -d "supabase/migrations" ] && [ -n "$(ls -A supabase/migrations 2>/dev/null)" ]; then
    echo "Applying migrations..."
    supabase db push 2>/dev/null || supabase migration up 2>/dev/null || true
  fi
fi

# Run setup script (use .venv if present; supabase_client.py handles local supabase/ folder shadowing)
cd "$REPO_ROOT"
if [ -f "$REPO_ROOT/.venv/bin/python" ]; then
  PYTHON="$REPO_ROOT/.venv/bin/python"
elif [ -f "$REPO_ROOT/venv/bin/python" ]; then
  PYTHON="$REPO_ROOT/venv/bin/python"
else
  PYTHON="${PYTHON:-python3}"
fi
if ! command -v "$PYTHON" &>/dev/null; then
  PYTHON="python"
fi

"$PYTHON" -m execution.operations.setup_company --name "$COMPANY_NAME" --template "$TEMPLATE"

echo ""
echo "Done. Sign up the first user at the portal (first user becomes admin)."
echo "MCP Superagent tools: clients, projects, tasks, notes, documents, directives, activity, workspace, integrations, profiles, warm_leads, applications."
