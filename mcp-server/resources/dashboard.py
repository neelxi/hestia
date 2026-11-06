"""Resource: hestia://dashboard — KPI snapshot."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.resource("hestia://dashboard")
    def dashboard() -> dict:
        """KPI dashboard: client count, project count, task breakdown, recent activity."""
        sb = get_supabase()

        clients = (
            sb.table("clients")
            .select("id", count="exact")
            .eq("status", "active")
            .execute()
        )

        projects = (
            sb.table("projects")
            .select("id", count="exact")
            .eq("status", "active")
            .execute()
        )

        tasks_todo = (
            sb.table("tasks")
            .select("id", count="exact")
            .eq("status", "todo")
            .execute()
        )
        tasks_in_progress = (
            sb.table("tasks")
            .select("id", count="exact")
            .eq("status", "in_progress")
            .execute()
        )
        tasks_done = (
            sb.table("tasks")
            .select("id", count="exact")
            .eq("status", "done")
            .execute()
        )

        recent_activity = (
            sb.table("activity_log")
            .select("*")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
            .data
        )

        return {
            "active_clients": clients.count or 0,
            "active_projects": projects.count or 0,
            "tasks": {
                "todo": tasks_todo.count or 0,
                "in_progress": tasks_in_progress.count or 0,
                "done": tasks_done.count or 0,
            },
            "recent_activity": recent_activity,
        }
