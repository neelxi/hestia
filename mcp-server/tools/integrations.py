"""Tools for listing and managing integrations."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def list_integrations() -> list[dict]:
        """List all integrations. Returns provider name, status, last sync time."""
        rows = (
            get_supabase()
            .table("integrations")
            .select("id, status, last_synced_at, provider_id")
            .execute()
            .data
        )
        providers = {}
        if rows:
            provider_ids = list({r["provider_id"] for r in rows if r.get("provider_id")})
            if provider_ids:
                prov_rows = (
                    get_supabase()
                    .table("integration_providers")
                    .select("id, name, slug")
                    .in_("id", provider_ids)
                    .execute()
                    .data
                )
                providers = {p["id"]: p for p in prov_rows}
        return [
            {
                "id": r["id"],
                "provider": providers.get(r["provider_id"], {}).get("name", "Unknown"),
                "slug": providers.get(r["provider_id"], {}).get("slug", ""),
                "status": r["status"],
                "last_synced_at": r.get("last_synced_at"),
            }
            for r in (rows or [])
        ]

    @mcp.tool()
    def update_integration(integration_id: str, updates: dict) -> dict:
        """Update an integration. Pass a dict of fields to change: status, field_mappings. Do not update credentials or webhook_secret."""
        allowed = {"status", "field_mappings"}
        filtered = {k: v for k, v in updates.items() if k in allowed}
        if not filtered:
            raise ValueError("No allowed fields to update. Use status and/or field_mappings.")
        return (
            get_supabase()
            .table("integrations")
            .update(filtered)
            .eq("id", integration_id)
            .execute()
            .data[0]
        )

