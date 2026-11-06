"""Special directive tools that can't be genericized — run_directive returns content for Claude to execute."""

import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def run_directive(directive_id: str, input_data: Optional[dict] = None) -> dict:
        """Execute a directive: logs a run, returns the directive content for Claude to follow.

        Returns both the directive content and the run_id so the caller can
        mark the run as completed/failed afterwards (use update_record on directive_runs).
        """
        sb = get_supabase()
        directive = (
            sb.table("directives")
            .select("*")
            .eq("id", directive_id)
            .single()
            .execute()
            .data
        )
        run = (
            sb.table("directive_runs")
            .insert({"directive_id": directive_id, "status": "running", "input": input_data or {}})
            .execute()
            .data[0]
        )
        return {
            "run_id": run["id"],
            "directive_title": directive["title"],
            "directive_content": directive["content"],
            "input": input_data or {},
        }
