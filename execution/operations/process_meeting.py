"""Meeting processing execution script.

Stores a meeting transcript as a note record and returns structured data
for the agent to create tasks from. The actual NLP extraction of action
items is left to the LLM layer (the agent) — this script handles the
deterministic database operations.

Usage (from agent / MCP):
    from execution.operations.process_meeting import run
    result = run(client_id="uuid", transcript_text="...")
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.supabase_client import get_supabase
from core.utils import utc_now


def run(
    client_id: str,
    transcript_text: str,
    *,
    source: str = "manual",
    meeting_date: str | None = None,
    project_id: str | None = None,
    title: str | None = None,
    **kwargs,
) -> dict:
    """Store a meeting transcript and return structured data for the agent.

    The agent is responsible for:
      - Extracting action items from the transcript (LLM task)
      - Creating tasks from those action items
      - Generating the client-facing summary

    This script handles:
      - Validating the client exists
      - Storing the transcript as a note
      - Logging the activity

    Returns a dict with the note_id, client info, and the raw transcript
    for the agent to process.
    """
    sb = get_supabase()

    # --- Validate client exists ----------------------------------------------
    client_resp = (
        sb.table("clients")
        .select("id, name, email")
        .eq("id", client_id)
        .single()
        .execute()
    )
    client = client_resp.data
    if not client:
        raise ValueError(f"Client {client_id} not found")

    # --- Store transcript as note --------------------------------------------
    now = utc_now()
    note_payload = {
        "client_id": client_id,
        "type": "meeting_transcript",
        "source": source,
        "content": transcript_text,
        "metadata": {
            "meeting_date": meeting_date or now[:10],
            "processed_at": now,
        },
    }
    if project_id:
        note_payload["project_id"] = project_id
    if title:
        note_payload["metadata"]["title"] = title

    note_resp = sb.table("notes").insert(note_payload).execute()
    note_id = note_resp.data[0]["id"]

    # --- Log activity --------------------------------------------------------
    sb.table("activity_log").insert(
        {
            "actor_type": "mcp-agent",
            "action": "meeting_processed",
            "entity_type": "note",
            "entity_id": note_id,
            "details": {
                "client_id": client_id,
                "client_name": client["name"],
                "source": source,
                "transcript_length": len(transcript_text),
            },
        }
    ).execute()

    return {
        "note_id": note_id,
        "client_id": client_id,
        "client_name": client["name"],
        "source": source,
        "meeting_date": meeting_date or now[:10],
        "transcript_length": len(transcript_text),
        "transcript_preview": transcript_text[:500] if len(transcript_text) > 500 else transcript_text,
    }


def create_tasks_from_action_items(
    client_id: str,
    project_id: str | None,
    action_items: list[dict],
) -> list[str]:
    """Bulk-create tasks from extracted action items.

    Each item in action_items should have:
      - title (str, required)
      - description (str, optional)
      - priority (str, optional — defaults to "medium")
      - due_date (str, optional — ISO date)
      - assignee_id (str, optional)

    Returns list of created task ids.
    """
    if not action_items:
        return []

    sb = get_supabase()

    task_rows = []
    for item in action_items:
        row = {
            "client_id": client_id,
            "title": item["title"],
            "status": "todo",
            "priority": item.get("priority", "medium"),
        }
        if project_id:
            row["project_id"] = project_id
        if item.get("description"):
            row["description"] = item["description"]
        if item.get("due_date"):
            row["due_date"] = item["due_date"]
        if item.get("assignee_id"):
            row["assignee_id"] = item["assignee_id"]
        task_rows.append(row)

    resp = sb.table("tasks").insert(task_rows).execute()
    return [t["id"] for t in resp.data]


if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="Process a meeting transcript")
    parser.add_argument("--client-id", required=True, help="Client UUID")
    parser.add_argument("--transcript", required=True, help="Transcript text or path to .txt file")
    parser.add_argument("--source", default="manual", help="Source (e.g. manual or integration slug)")
    parser.add_argument("--date", default=None, help="Meeting date (ISO)")
    parser.add_argument("--project-id", default=None, help="Project UUID")
    parser.add_argument("--title", default=None, help="Meeting title")
    args = parser.parse_args()

    transcript = args.transcript
    if Path(transcript).is_file():
        transcript = Path(transcript).read_text()

    result = run(
        client_id=args.client_id,
        transcript_text=transcript,
        source=args.source,
        meeting_date=args.date,
        project_id=args.project_id,
        title=args.title,
    )
    print(json.dumps(result, indent=2))
