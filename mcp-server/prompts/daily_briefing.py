"""Prompt: morning daily briefing."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def daily_briefing() -> str:
        """Generate a morning briefing covering today's priorities and yesterday's activity."""
        return """Generate a daily morning briefing.

Steps:
1. Fetch the hestia://dashboard resource for current KPIs.
2. List tasks due today or overdue with list_records("tasks", {{"status": "todo"}}, 50) and filter by due_date in your logic.
3. Get recent activity with list_records("activity_log", {{}}, 20).
4. Check for any tasks marked 'urgent' priority.
5. Compile the briefing:
   - Good morning greeting with today's date
   - KPI snapshot
   - Urgent items requiring immediate attention
   - Tasks due today (grouped by client/project)
   - Overdue items
   - Yesterday's highlights
   - Suggested focus areas for the day"""
