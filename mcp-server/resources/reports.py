"""Resource: hestia://directives — all directives with recent runs."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.resource("hestia://directives")
    def directives_report() -> dict:
        """All directives and their most recent runs."""
        sb = get_supabase()

        directives = (
            sb.table("directives")
            .select("*")
            .order("title")
            .execute()
            .data
        )

        recent_runs = (
            sb.table("directive_runs")
            .select("*, directives(title)")
            .order("started_at", desc=True)
            .limit(25)
            .execute()
            .data
        )

        return {"directives": directives, "recent_runs": recent_runs}
