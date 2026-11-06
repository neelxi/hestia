"""Tools for the workspace table (single-tenant: one row per deployment)."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def get_workspace() -> dict:
        """Get the workspace config (name, type, template_id, settings). Single-tenant: one row."""
        rows = (
            get_supabase()
            .table("workspace")
            .select("*")
            .limit(1)
            .execute()
            .data
        )
        if not rows:
            raise ValueError("No workspace found. Run setup_new_business.sh first.")
        return rows[0]

    @mcp.tool()
    def update_workspace(updates: dict) -> dict:
        """Update workspace. Pass a dict of fields to change: name, type, template_id, settings."""
        rows = (
            get_supabase()
            .table("workspace")
            .select("id")
            .limit(1)
            .execute()
            .data
        )
        if not rows:
            raise ValueError("No workspace found. Run setup_new_business.sh first.")
        return (
            get_supabase()
            .table("workspace")
            .update(updates)
            .eq("id", rows[0]["id"])
            .execute()
            .data[0]
        )
