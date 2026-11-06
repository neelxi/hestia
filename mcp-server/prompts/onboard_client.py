"""Prompt: onboard a new client."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def onboard_client(client_name: str, client_email: str) -> str:
        """Generate instructions for onboarding a new client into Hestia."""
        return f"""You are onboarding a new client into Hestia.

Client name: {client_name}
Client email: {client_email}

Follow these steps:
1. Use create_record("clients", {{"name": "{client_name}", "email": "{client_email}", "status": "active"}}) to add the client.
2. Create a default project with create_record("projects", {{"name": "{client_name} — Onboarding", "client_id": "<client_id from step 1>", "status": "active"}}).
3. Create these onboarding tasks with create_record("tasks", ...) under that project:
   - "Send welcome email" (priority: high)
   - "Schedule kickoff call" (priority: high)
   - "Collect business requirements" (priority: medium)
   - "Set up integrations" (priority: medium)
   - "Deliver onboarding packet" (priority: low)
4. Log activity with create_record("activity_log", {{"action": "client_onboarded", "entity_type": "client", "entity_id": "<client_id>", "actor_type": "mcp-agent"}}).
5. Summarise what was created and list any next steps for the team."""
