#!/usr/bin/env python3
"""Seed ICP and lead magnet into directives table."""

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")

from execution.core.supabase_client import get_supabase

ICP_PATH = REPO_ROOT / "marketing" / "icp.md"
LEAD_MAGNET_PATH = REPO_ROOT / "marketing" / "lead-magnet" / "The Brokerage AI Operations Blueprint.md"


def main():
    sb = get_supabase()

    # Check if already exists (by title)
    existing = sb.table("directives").select("id, title").execute()
    titles = {r["title"] for r in (existing.data or [])}

    created = []

    if "Ideal Customer Profile — Mid-Size Real Estate Brokerages" not in titles:
        icp_content = ICP_PATH.read_text()
        row = sb.table("directives").insert({
            "title": "Ideal Customer Profile — Mid-Size Real Estate Brokerages",
            "content": icp_content,
            "category": "marketing",
            "is_automated": False,
        }).execute()
        if row.data:
            created.append(row.data[0]["title"])
            print("Added: Ideal Customer Profile — Mid-Size Real Estate Brokerages")
    else:
        print("Skipped (exists): Ideal Customer Profile — Mid-Size Real Estate Brokerages")

    if "The Brokerage AI Operations Blueprint" not in titles:
        lm_content = LEAD_MAGNET_PATH.read_text()
        row = sb.table("directives").insert({
            "title": "The Brokerage AI Operations Blueprint",
            "content": lm_content,
            "category": "marketing",
            "is_automated": False,
        }).execute()
        if row.data:
            created.append(row.data[0]["title"])
            print("Added: The Brokerage AI Operations Blueprint")
    else:
        print("Skipped (exists): The Brokerage AI Operations Blueprint")

    if created:
        print(f"\nDone. Added {len(created)} directive(s) to the database.")
    else:
        print("\nDone. No new directives added (both already exist).")


if __name__ == "__main__":
    main()
