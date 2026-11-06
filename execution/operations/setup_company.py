"""Workspace setup execution script.

Creates or replaces the workspace in Supabase, applies a template, and seeds
default directives. Used to bootstrap a new deployment (Hestia or client).

Usage:
    # From repo root with .env configured:
    python -m execution.operations.setup_company --name "Acme Brokerage" --template brokerage

    # For Hestia:
    python -m execution.operations.setup_company --name "Hestia" --template hestia
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Add parent for imports when run as module
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Directories relative to repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = REPO_ROOT / "templates"
DIRECTIVES_DIR = REPO_ROOT / "directives"

# Mapping from directive slug to markdown file path (relative to directives/)
DIRECTIVE_SLUG_TO_PATH: dict[str, str] = {
    "onboard-client": "database/_base/onboard-client.md",
    "process-meeting": "database/_base/process-meeting.md",
    "prep-for-review": "database/_base/prep-for-review.md",
    "quarterly-review": "database/_base/quarterly-review.md",
    "quarterly-report": "database/_base/quarterly-review.md",  # alias
    "task-processing": "database/_base/task-processing.md",
    "compliance-checklist": "database/_base/compliance-checklist.md",
    "campaign-brief": "database/_base/campaign-brief.md",
    "deliverable-review": "database/_base/deliverable-review.md",
}


def load_template(template_id: str) -> dict:
    """Load and merge template (base + extends)."""
    path = TEMPLATES_DIR / f"{template_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Template not found: {template_id}.json")

    raw = json.loads(path.read_text())
    if "extends" in raw:
        base = load_template(raw["extends"])
        # Deep merge: base first, then override with raw (excluding extends)
        merged = deep_merge(base, {k: v for k, v in raw.items() if k != "extends"})
        merged["id"] = raw["id"]
        merged["name"] = raw["name"]
        return merged
    return raw


def deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base."""
    result = dict(base)
    for key, val in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result


def seed_directives(supabase, default_directives: list[str]) -> list[str]:
    """Seed directives from markdown files. Returns list of created directive IDs."""
    from core.utils import load_directive

    created = []
    for slug in default_directives:
        rel_path = DIRECTIVE_SLUG_TO_PATH.get(slug)
        if not rel_path:
            print(f"  [skip] {slug} — no directive file mapping")
            continue

        full_path = DIRECTIVES_DIR / rel_path
        if not full_path.exists():
            print(f"  [skip] {slug} — file not found: {rel_path}")
            continue

        parsed = load_directive(str(full_path))
        meta = parsed.get("metadata") or {}
        body = parsed.get("body") or ""

        title = meta.get("title", slug.replace("-", " ").title())
        category = meta.get("category", "operations") or "operations"

        # Full content = original markdown (for MCP to read)
        content = full_path.read_text()

        row = {
            "title": title,
            "content": content,
            "category": category,
            "is_automated": False,
        }
        resp = supabase.table("directives").insert(row).execute()
        if resp.data:
            created.append(resp.data[0]["id"])
            print(f"  [ok] {slug} -> {title}")

    return created


def run(
    company_name: str,
    template_id: str,
    *,
    company_type: str | None = None,
    dry_run: bool = False,
) -> dict:
    """Create or replace workspace and seed directives.

    Returns dict with template_id, directives_seeded, and next_steps.
    """
    if dry_run:
        template = load_template(template_id)
        resolved_type = company_type or template.get("id", "generic")
        default_directives = template.get("defaultDirectives", [])
        return {
            "dry_run": True,
            "workspace_name": company_name,
            "template_id": template_id,
            "workspace_type": resolved_type,
            "default_directives": default_directives,
            "next_steps": [
                "Run without --dry-run to create the workspace",
            ],
        }

    from core.supabase_client import get_supabase

    sb = get_supabase()
    template = load_template(template_id)

    resolved_type = company_type or template.get("id", "generic")
    default_directives = template.get("defaultDirectives", [])

    # Create or replace workspace (single-tenant: one row)
    existing = sb.table("workspace").select("id").limit(1).execute()
    workspace_row = {
        "name": company_name,
        "type": resolved_type,
        "template_id": template_id,
        "settings": {
            "terminology": template.get("terminology", {}),
            "workflows": template.get("workflows", {}),
            "compliance": template.get("compliance", {}),
            "ownerDashboard": template.get("ownerDashboard", {}),
            "recommendedIntegrations": template.get("recommendedIntegrations", []),
        },
    }
    if existing.data:
        workspace_id = existing.data[0]["id"]
        sb.table("workspace").update(workspace_row).eq("id", workspace_id).execute()
    else:
        workspace_resp = sb.table("workspace").insert(workspace_row).execute()
        if not workspace_resp.data:
            raise RuntimeError("Failed to create workspace")
        workspace_id = workspace_resp.data[0]["id"]
    print(f"Created workspace: {company_name} ({workspace_id})")

    # Clear existing directives and seed fresh
    existing_dirs = sb.table("directives").select("id").execute()
    if existing_dirs.data:
        ids = [d["id"] for d in existing_dirs.data]
        sb.table("directives").delete().in_("id", ids).execute()
    print("Seeding directives...")
    directive_ids = seed_directives(sb, default_directives)
    print(f"Seeded {len(directive_ids)} directives")

    # Log activity
    sb.table("activity_log").insert(
        {
            "actor_type": "system",
            "action": "workspace_setup",
            "entity_type": "workspace",
            "entity_id": workspace_id,
            "details": {
                "template_id": template_id,
                "directives_seeded": len(directive_ids),
            },
        }
    ).execute()

    return {
        "workspace_id": workspace_id,
        "workspace_name": company_name,
        "template_id": template_id,
        "directives_seeded": len(directive_ids),
        "next_steps": [
            "Sign up the first user at the portal (first user becomes admin)",
            f"Configure integrations: {', '.join(template.get('recommendedIntegrations', []))}",
        ],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Set up workspace with template and directives"
    )
    parser.add_argument("--name", required=True, help="Workspace name")
    parser.add_argument(
        "--template",
        required=True,
        choices=["base", "agency", "professional-services", "brokerage", "hestia"],
        help="Template ID to apply",
    )
    parser.add_argument("--type", dest="company_type", default=None, help="Override workspace type")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    args = parser.parse_args()

    result = run(
        company_name=args.name,
        template_id=args.template,
        company_type=args.company_type,
        dry_run=args.dry_run,
    )
    print()
    print(json.dumps(result, indent=2))
