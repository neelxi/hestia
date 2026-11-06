"""Prompt: generate a status report."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def status_report() -> str:
        """Generate a company-wide status report across all clients and projects."""
        return """Generate a comprehensive status report for the company.

Steps:
1. Fetch the hestia://dashboard resource for KPI overview.
2. List all active projects and group them by client.
3. For each project, summarise:
   - Current status
   - Tasks completed this period vs. total
   - Any blockers or overdue items
4. Pull the activity feed for the last 7 days (limit 50).
5. Compile the report with:
   - Executive summary (1-2 paragraphs)
   - KPI snapshot (clients, projects, tasks)
   - Per-client project status
   - Key accomplishments this period
   - Risks and blockers
   - Recommended actions"""
