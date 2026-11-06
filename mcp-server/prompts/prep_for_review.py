"""Prompt: prepare a review briefing for a client."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def prep_for_review(client_name: str) -> str:
        """Build a comprehensive review briefing for an upcoming client review meeting."""
        return f"""Prepare a review briefing for client: {client_name}.

Steps:
1. Look up the client using search_records("clients", "{client_name}").
2. Fetch their full profile via the hestia://clients/{{client_id}} resource.
3. For each active project, gather:
   - Project status and timeline
   - Tasks completed vs. outstanding
   - Any overdue tasks
4. Pull recent notes and meeting transcripts for context.
5. Check recent activity_feed filtered to this client.
6. Compile a briefing document with:
   - Client overview (name, status, contact)
   - Project scorecards (progress %, key milestones)
   - Outstanding action items
   - Talking points / risks to raise
   - Recommended next steps"""
