"""Client onboarding execution script.

Creates a client record, default project, and onboarding task checklist
in Supabase. Used by the onboard-client directive.

Usage (from agent / MCP):
    from execution.operations.onboard_client import run
    result = run(client_name="Acme Corp", client_email="hello@acme.com")
"""

from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.supabase_client import get_supabase
from core.utils import utc_now

ONBOARDING_TASKS = [
    {"title": "Send welcome email / packet",            "priority": "high",   "days_offset": 0},
    {"title": "Schedule initial consultation",          "priority": "high",   "days_offset": 2},
    {"title": "Collect required documents",             "priority": "medium", "days_offset": 5},
    {"title": "Set up client portal access",            "priority": "high",   "days_offset": 1},
    {"title": "Complete needs assessment",              "priority": "medium", "days_offset": 7},
    {"title": "Create service agreement",               "priority": "medium", "days_offset": 5},
    {"title": "Configure integrations (if applicable)", "priority": "low",    "days_offset": 10},
    {"title": "First progress check-in",                "priority": "medium", "days_offset": 14},
]


def run(
    client_name: str,
    client_email: str,
    *,
    client_phone: str | None = None,
    project_name: str | None = None,
    assignee_id: str | None = None,
    notes: str | None = None,
    **kwargs,
) -> dict:
    """Create a client, project, and onboarding tasks.

    Returns a dict with created record ids and a summary.
    Raises on critical failures (duplicate email, missing env).
    """
    sb = get_supabase()
    today = date.today()

    # --- Check for duplicate email -------------------------------------------
    existing = (
        sb.table("clients")
        .select("id, name")
        .eq("email", client_email)
        .execute()
    )
    if existing.data:
        raise ValueError(
            f"Client with email {client_email} already exists: "
            f"{existing.data[0]['name']} ({existing.data[0]['id']})"
        )

    # --- Create client -------------------------------------------------------
    client_payload = {
        "name": client_name,
        "email": client_email,
        "status": "active",
        "metadata": {"onboarded_at": utc_now(), "notes": notes or ""},
    }
    if client_phone:
        client_payload["phone"] = client_phone

    client_resp = sb.table("clients").insert(client_payload).execute()
    client_id = client_resp.data[0]["id"]

    # --- Create default project ----------------------------------------------
    proj_name = project_name or f"Onboarding — {client_name}"
    project_resp = (
        sb.table("projects")
        .insert(
            {
                "client_id": client_id,
                "name": proj_name,
                "status": "active",
                "start_date": today.isoformat(),
                "description": f"Default onboarding project for {client_name}",
            }
        )
        .execute()
    )
    project_id = project_resp.data[0]["id"]

    # --- Create onboarding tasks ---------------------------------------------
    task_rows = []
    for t in ONBOARDING_TASKS:
        row = {
            "project_id": project_id,
            "client_id": client_id,
            "title": t["title"],
            "status": "todo",
            "priority": t["priority"],
            "due_date": (today + timedelta(days=t["days_offset"])).isoformat(),
        }
        if assignee_id:
            row["assignee_id"] = assignee_id
        task_rows.append(row)

    tasks_resp = sb.table("tasks").insert(task_rows).execute()
    task_ids = [t["id"] for t in tasks_resp.data]

    # --- Log activity --------------------------------------------------------
    sb.table("activity_log").insert(
        {
            "actor_type": "mcp-agent",
            "action": "client_onboarded",
            "entity_type": "client",
            "entity_id": client_id,
            "details": {
                "project_id": project_id,
                "tasks_created": len(task_ids),
                "client_email": client_email,
            },
        }
    ).execute()

    return {
        "client_id": client_id,
        "project_id": project_id,
        "project_name": proj_name,
        "task_ids": task_ids,
        "tasks_created": len(task_ids),
    }


if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="Onboard a new client")
    parser.add_argument("--name", required=True, help="Client name")
    parser.add_argument("--email", required=True, help="Client email")
    parser.add_argument("--phone", default=None, help="Client phone")
    parser.add_argument("--project", default=None, help="Project name override")
    parser.add_argument("--assignee", default=None, help="Assignee profile id")
    args = parser.parse_args()

    result = run(
        client_name=args.name,
        client_email=args.email,
        client_phone=args.phone,
        project_name=args.project,
        assignee_id=args.assignee,
    )
    print(json.dumps(result, indent=2))
