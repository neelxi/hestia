"""Prompt: quarterly business review / audit."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def quarterly_review() -> str:
        """Generate a quarterly business review covering all operations."""
        return """Conduct a quarterly business review.

Steps:
1. Fetch the hestia://dashboard resource for current state.
2. List all clients and categorise by status (active, inactive, prospect).
3. For each active client:
   - Count projects (active vs. completed)
   - Count tasks (completed vs. outstanding)
   - Pull recent notes for qualitative context
4. Check integration health via list_integrations.
5. Review directive_runs from the hestia://directives resource for SOP compliance.
6. Compile the quarterly review:
   - Executive summary
   - Client portfolio overview (new, retained, churned)
   - Project delivery metrics
   - Task completion rates
   - Integration/automation health
   - SOP adherence and gaps
   - Recommendations for next quarter
   - Action items to implement"""
