"""Resource template: hestia://clients/{client_id} — full client profile."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.resource("hestia://clients/{client_id}")
    def client_profile(client_id: str) -> dict:
        """Full client profile including projects, tasks, and notes."""
        sb = get_supabase()

        client = (
            sb.table("clients")
            .select("*")
            .eq("id", client_id)
            .single()
            .execute()
            .data
        )

        projects = (
            sb.table("projects")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
            .data
        )

        tasks = (
            sb.table("tasks")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
            .data
        )

        notes = (
            sb.table("notes")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
            .data
        )

        return {
            "client": client,
            "projects": projects,
            "tasks": tasks,
            "notes": notes,
        }
