"""Prompt: find and execute a named SOP / directive."""

from fastmcp import FastMCP


def register(mcp: FastMCP) -> None:

    @mcp.prompt()
    def run_sop(sop_name: str) -> str:
        """Find a directive/SOP by name and execute it step by step."""
        return f"""Execute the SOP named: "{sop_name}"

Steps:
1. Use search_records("directives", "{sop_name}") or list_records("directives", {{}}, 100) to find a directive whose title matches or contains "{sop_name}".
2. If no match is found, inform the user and list available directives.
3. If a match is found, use run_directive to start a tracked run.
4. Read the directive content returned and follow its instructions precisely.
5. As you complete each step, log activities as appropriate.
6. When finished, summarise what was done and any issues encountered.
7. If the directive references execution scripts, note which ones were called."""
