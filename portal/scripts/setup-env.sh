#!/bin/bash
# Copy Supabase env vars from repo root to portal/.env.local
# Run from repo root: ./portal/scripts/setup-env.sh

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV="$ROOT/.env"
LOCAL="$ROOT/portal/.env.local"

if [ ! -f "$ENV" ]; then
  echo "Error: $ENV not found. Create it first with Supabase credentials."
  exit 1
fi

echo "# Auto-generated from $ENV - do not commit" > "$LOCAL"
grep -E "^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=" "$ENV" >> "$LOCAL" 2>/dev/null || true

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" "$LOCAL"; then
  echo "Warning: No Supabase vars found in $ENV. Add:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=..."
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
  echo "  SUPABASE_SERVICE_ROLE_KEY=..."
  exit 1
fi

echo "Created $LOCAL"
