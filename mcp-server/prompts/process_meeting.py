"""Prompt: process a meeting for a client."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def process_meeting(client_name: str) -> str:
        """Instructions for the full meeting processing chain after a client meeting."""
        return f"""You just finished a meeting with client: {client_name}.

Follow these steps to process the meeting:
1. Search for the client using search_records("clients", "{client_name}").
2. Check for recent meeting transcripts with list_records("notes", {{"type": "meeting_transcript", "client_id": "<client_id>"}}).
3. If a transcript exists, summarise the key points, decisions, and action items.
4. For each action item, create_record("tasks", {{"title": "...", "client_id": "...", "priority": "...", "due_date": "..."}}).
5. Create a note with create_record("notes", {{"content": "...", "type": "note", "client_id": "...", "source": "manual"}}).
6. Log activity with create_record("activity_log", {{"action": "meeting_processed", "entity_type": "client", "entity_id": "<client_id>", "actor_type": "mcp-agent"}}).
7. Present a summary of:
   - Key decisions made
   - Tasks created (with priorities)
   - Any follow-up items that need manual attention"""
