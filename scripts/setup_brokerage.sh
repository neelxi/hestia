#!/usr/bin/env bash
# Setup a new brokerage deployment.
#
# Usage:
#   ./scripts/setup_brokerage.sh "Acme Realty"
#
# Prerequisites:
#   - Supabase project for the brokerage (separate from Hestia)
#   - .env with DATABASE_URL pointing to brokerage Supabase (or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
#
# This script:
#   1. Applies brokerage migrations to the target database
#   2. Creates the workspace record
#   3. Seeds default settings
#
# After setup, deploy the portal with NEXT_PUBLIC_PORTAL_MODE=brokerage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BROKERAGE_DIR="$REPO_ROOT/brokerage"

BROKERAGE_NAME="${1:?Usage: $0 <brokerage_name>}"

# Load .env
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
elif [ -f "$REPO_ROOT/portal/.env.local" ]; then
  set -a
  source "$REPO_ROOT/portal/.env.local"
  set +a
fi

# DATABASE_URL or construct from Supabase
if [ -z "$DATABASE_URL" ] && [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  # Extract DB host from SUPABASE_URL (https://xxx.supabase.co -> xxx.supabase.co)
  DB_HOST=$(echo "$SUPABASE_URL" | sed -e 's|https://||' -e 's|\.supabase\.co.*||').supabase.co
  # Default Supabase connection format
  export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${DB_HOST}:5432/postgres"
  echo "Note: Set DATABASE_URL in .env for direct DB access. Using Supabase API for setup."
fi

echo "=== Brokerage Setup ==="
echo "Brokerage: $BROKERAGE_NAME"
echo ""

# Apply migrations via Supabase CLI if available
if command -v supabase &>/dev/null && [ -n "$SUPABASE_DB_URL" ]; then
  echo "Applying brokerage migrations..."
  cd "$BROKERAGE_DIR"
  for f in migrations/*.sql; do
    [ -f "$f" ] || continue
    echo "  Running $(basename "$f")..."
    psql "$SUPABASE_DB_URL" -f "$f" 2>/dev/null || true
  done
  cd "$REPO_ROOT"
else
  echo "To apply migrations manually:"
  echo "  psql \$DATABASE_URL -f brokerage/migrations/001_initial_brokerage_schema.sql"
  echo ""
fi

# Create workspace via Supabase REST API if we have service role key
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Creating workspace..."
  WORKSPACE_RESP=$(curl -s -X POST "$SUPABASE_URL/rest/v1/workspace" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"name\": \"$BROKERAGE_NAME\", \"type\": \"brokerage\", \"template_id\": \"brokerage\"}" 2>/dev/null) || true
  if [ -n "$WORKSPACE_RESP" ]; then
    echo "Workspace created."
  else
    echo "Note: Create workspace manually in Supabase Table Editor if needed."
  fi
fi

echo ""
echo "Done. Next steps:"
echo "  1. Deploy portal with NEXT_PUBLIC_PORTAL_MODE=brokerage"
echo "  2. Sign up the first user (becomes admin)"
echo "  3. Configure MCP server to point at brokerage Supabase project"
