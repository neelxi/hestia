"""Resource: hestia://docs — internal documentation list."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from execution.core.supabase_client import get_supabase

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.resource("hestia://docs")
    def docs() -> list[dict]:
        """List all internal docs (title, slug, category, content)."""
        sb = get_supabase()
        result = (
            sb.table("docs")
            .select("*")
            .order("category", desc=False)
            .order("title", desc=False)
            .execute()
        )
        return result.data or []
