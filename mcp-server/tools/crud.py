"""Generic CRUD tools — one tool per operation, works across all tables."""

import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP

# Tables that support each operation. Excludes: activity_log (audit), workspace (singleton).
DELETABLE = {
    # Hestia operations
    "clients", "projects", "tasks", "notes", "documents", "directives",
    "docs", "warm_leads", "applications", "integrations",
    # Brokerage operations
    "agents", "teams", "transactions", "properties", "commissions", "leads",
    "recruiting_prospects", "compliance_records", "sops", "workflows",
}
CREATABLE = DELETABLE | {"activity_log", "directive_runs"}
UPDATABLE = CREATABLE | {"directive_runs", "workspace"}
# workspace is special: use get_workspace/update_workspace. But get_record/list_records can read it.
READABLE = UPDATABLE | {"profiles", "integration_providers", "settings"}

# Tables with text search. Map table -> columns to search (ilike)
SEARCH_COLUMNS = {
    "clients": ["name", "email"],
    "notes": ["content"],
    "warm_leads": ["contact_name", "contact_email", "brokerage_name"],
    "applications": ["name", "email", "brokerage"],
    "profiles": ["display_name"],
    "directives": ["title"],
    "docs": ["title", "content"],
    "agents": ["first_name", "last_name", "email", "license_number"],
    "transactions": ["address", "external_id"],
    "leads": ["name", "email", "phone"],
    "recruiting_prospects": ["first_name", "last_name", "email", "current_brokerage"],
    "sops": ["title", "content"],
}


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def delete_record(table: str, record_id: str) -> dict:
        """Permanently remove a record from an allowed Hestia or brokerage table."""
        if table not in DELETABLE:
            raise ValueError(f"Table '{table}' not deletable. Allowed: {sorted(DELETABLE)}")
        result = get_supabase().table(table).delete().eq("id", record_id).execute()
        return {"deleted": True, "table": table, "id": record_id, "count": len(result.data)}

    @mcp.tool()
    def create_record(table: str, data: dict) -> dict:
        """Create a record in an allowed Hestia or brokerage table. Pass column names and values in data."""
        if table not in CREATABLE:
            raise ValueError(f"Table '{table}' not creatable. Allowed: {sorted(CREATABLE)}")
        return get_supabase().table(table).insert(data).execute().data[0]

    @mcp.tool()
    def update_record(table: str, record_id: str, updates: dict) -> dict:
        """Update a record. Pass updates as dict of column names to values. Tables: all creatable + directive_runs, workspace."""
        if table not in UPDATABLE:
            raise ValueError(f"Table '{table}' not updatable. Allowed: {sorted(UPDATABLE)}")
        if table == "workspace":
            rows = get_supabase().table("workspace").select("id").limit(1).execute().data
            if not rows:
                raise ValueError("No workspace found. Run setup_new_business.sh first.")
            record_id = rows[0]["id"]
        if table == "integrations":
            allowed = {"status", "field_mappings"}
            updates = {k: v for k, v in updates.items() if k in allowed}
            if not updates:
                raise ValueError("For integrations, only status and field_mappings can be updated.")
        if table == "directive_runs" and updates.get("status") in ("completed", "failed"):
            from datetime import datetime, timezone
            updates = dict(updates)
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        return (
            get_supabase()
            .table(table)
            .update(updates)
            .eq("id", record_id)
            .execute()
            .data[0]
        )

    @mcp.tool()
    def get_record(table: str, record_id: str) -> dict:
        """Get a single record by ID. Tables: all (clients, projects, tasks, notes, documents, directives, warm_leads, applications, integrations, activity_log, directive_runs, profiles, workspace, integration_providers)."""
        if table == "workspace":
            rows = get_supabase().table("workspace").select("*").limit(1).execute().data
            if not rows:
                raise ValueError("No workspace found. Run setup_new_business.sh first.")
            return rows[0]
        if table not in READABLE:
            raise ValueError(f"Table '{table}' not readable. Allowed: {sorted(READABLE)}")
        return (
            get_supabase()
            .table(table)
            .select("*")
            .eq("id", record_id)
            .single()
            .execute()
            .data
        )

    @mcp.tool()
    def list_records(
        table: str,
        filters: Optional[dict] = None,
        limit: int = 50,
        order_by: Optional[str] = "created_at",
        order_desc: bool = True,
    ) -> list[dict]:
        """List records with optional filters. Tables: all. Filters: dict of column=value (e.g. client_id, status, assignee_id)."""
        if table not in READABLE:
            raise ValueError(f"Table '{table}' not listable. Allowed: {sorted(READABLE)}")
        q = get_supabase().table(table).select("*").limit(limit)
        if order_by:
            q = q.order(order_by, desc=order_desc)
        if filters:
            for col, val in filters.items():
                if val is not None:
                    q = q.eq(col, val)
        return q.execute().data

    @mcp.tool()
    def search_records(
        table: str,
        query: str,
        filters: Optional[dict] = None,
        limit: int = 25,
    ) -> list[dict]:
        """Search records by text across supported Hestia and brokerage tables."""
        if table not in SEARCH_COLUMNS:
            raise ValueError(f"Table '{table}' not searchable. Allowed: {sorted(SEARCH_COLUMNS)}")
        cols = SEARCH_COLUMNS[table]
        q = get_supabase().table(table).select("*").or_(",".join(f"{c}.ilike.%{query}%" for c in cols)).limit(limit)
        if filters:
            for col, val in filters.items():
                if val is not None:
                    q = q.eq(col, val)
        q = q.order("created_at", desc=True)
        return q.execute().data
