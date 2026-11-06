#!/usr/bin/env python3
"""Load a repeatable, judge-ready brokerage dataset into Supabase.

The script only upserts records with deterministic demo IDs. It is safe to run
again to refresh dates and values, and it does not delete existing data.
"""

from __future__ import annotations

import os
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))
load_dotenv(REPO_ROOT / ".env")

from execution.core.supabase_client import get_supabase


DEMO_NAMESPACE = uuid.UUID("266bf9ce-2b2d-46d8-a064-14b1255c38b9")


def demo_id(name: str) -> str:
    return str(uuid.uuid5(DEMO_NAMESPACE, name))


def iso_day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def iso_time(hours_ago: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()


def upsert(table: str, rows: list[dict]) -> None:
    get_supabase().table(table).upsert(rows, on_conflict="id").execute()
    print(f"  {table}: {len(rows)}")


def main() -> None:
    if not (
        os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    ) or not (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    ):
        raise SystemExit(
            "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and "
            "SUPABASE_SERVICE_ROLE_KEY in .env before seeding."
        )

    print("Loading the Summit Realty demo dataset...")

    team_ids = {
        "residential": demo_id("team-residential"),
        "luxury": demo_id("team-luxury"),
    }
    agent_ids = {
        "maya": demo_id("agent-maya-chen"),
        "jordan": demo_id("agent-jordan-blake"),
        "sofia": demo_id("agent-sofia-martinez"),
        "ethan": demo_id("agent-ethan-brooks"),
        "ava": demo_id("agent-ava-patel"),
    }
    transaction_ids = {
        "willow": demo_id("transaction-18-willow"),
        "lakeview": demo_id("transaction-742-lakeview"),
        "harbor": demo_id("transaction-91-harbor"),
        "maple": demo_id("transaction-305-maple"),
        "crest": demo_id("transaction-126-crest"),
    }

    existing_workspace = (
        get_supabase().table("workspace").select("id").limit(1).execute().data or []
    )
    workspace_id = (
        existing_workspace[0]["id"]
        if existing_workspace
        else demo_id("workspace-summit-realty")
    )

    upsert(
        "workspace",
        [
            {
                "id": workspace_id,
                "name": "Summit Realty Demo",
                "type": "brokerage",
                "template_id": "brokerage",
                "settings": {"demo": True, "market": "Greater Boston"},
            }
        ],
    )
    upsert(
        "teams",
        [
            {
                "id": team_ids["residential"],
                "name": "Residential Growth",
                "description": "High-velocity residential sales team",
            },
            {
                "id": team_ids["luxury"],
                "name": "Luxury & Waterfront",
                "description": "Premium listings and buyer representation",
            },
        ],
    )
    upsert(
        "agents",
        [
            {
                "id": agent_ids["maya"],
                "first_name": "Maya",
                "last_name": "Chen",
                "email": "maya.chen@demo.hestiaops.com",
                "phone": "617-555-0101",
                "license_number": "MA-RE-10428",
                "license_expiry": iso_day(310),
                "eo_policy_expiry": iso_day(220),
                "team_id": team_ids["luxury"],
                "status": "active",
                "external_id": "HWA-DEMO-AGENT-01",
                "metadata": {"demo": True, "ytd_volume": 6800000},
            },
            {
                "id": agent_ids["jordan"],
                "first_name": "Jordan",
                "last_name": "Blake",
                "email": "jordan.blake@demo.hestiaops.com",
                "phone": "617-555-0102",
                "license_number": "MA-RE-11803",
                "license_expiry": iso_day(185),
                "eo_policy_expiry": iso_day(28),
                "team_id": team_ids["residential"],
                "status": "active",
                "external_id": "HWA-DEMO-AGENT-02",
                "metadata": {"demo": True, "ytd_volume": 4200000},
            },
            {
                "id": agent_ids["sofia"],
                "first_name": "Sofia",
                "last_name": "Martinez",
                "email": "sofia.martinez@demo.hestiaops.com",
                "phone": "617-555-0103",
                "license_number": "MA-RE-12177",
                "license_expiry": iso_day(24),
                "eo_policy_expiry": iso_day(170),
                "team_id": team_ids["residential"],
                "status": "active",
                "external_id": "HWA-DEMO-AGENT-03",
                "metadata": {"demo": True, "ytd_volume": 3550000},
            },
            {
                "id": agent_ids["ethan"],
                "first_name": "Ethan",
                "last_name": "Brooks",
                "email": "ethan.brooks@demo.hestiaops.com",
                "phone": "617-555-0104",
                "license_number": "MA-RE-09552",
                "license_expiry": iso_day(260),
                "eo_policy_expiry": iso_day(260),
                "team_id": team_ids["luxury"],
                "status": "active",
                "external_id": "HWA-DEMO-AGENT-04",
                "metadata": {"demo": True, "ytd_volume": 8100000},
            },
            {
                "id": agent_ids["ava"],
                "first_name": "Ava",
                "last_name": "Patel",
                "email": "ava.patel@demo.hestiaops.com",
                "phone": "617-555-0105",
                "license_number": "MA-RE-13001",
                "license_expiry": iso_day(350),
                "eo_policy_expiry": iso_day(350),
                "team_id": team_ids["residential"],
                "status": "pending",
                "external_id": "HWA-DEMO-AGENT-05",
                "metadata": {"demo": True, "onboarding_stage": "orientation"},
            },
        ],
    )
    upsert(
        "transactions",
        [
            {
                "id": transaction_ids["willow"],
                "address": "18 Willow Street, Cambridge, MA",
                "list_price": 875000,
                "status": "active",
                "type": "Listing",
                "listing_agent_id": agent_ids["maya"],
                "closing_date": iso_day(21),
                "contingency_date": iso_day(7),
                "inspection_deadline": f"{iso_day(4)}T17:00:00+00:00",
                "external_id": "HWA-DEMO-TX-01",
                "metadata": {"demo": True, "source": "Referral"},
            },
            {
                "id": transaction_ids["lakeview"],
                "address": "742 Lakeview Avenue, Newton, MA",
                "list_price": 1245000,
                "status": "pending_close",
                "type": "Buyer representation",
                "buyer_agent_id": agent_ids["jordan"],
                "closing_date": iso_day(7),
                "contingency_date": iso_day(-3),
                "external_id": "HWA-DEMO-TX-02",
                "metadata": {"demo": True, "lender": "Harbor Lending"},
            },
            {
                "id": transaction_ids["harbor"],
                "address": "91 Harbor Way, Boston, MA",
                "list_price": 2380000,
                "status": "active",
                "type": "Dual-sided",
                "listing_agent_id": agent_ids["ethan"],
                "buyer_agent_id": agent_ids["maya"],
                "closing_date": iso_day(45),
                "contingency_date": iso_day(18),
                "external_id": "HWA-DEMO-TX-03",
                "metadata": {"demo": True, "tier": "luxury"},
            },
            {
                "id": transaction_ids["maple"],
                "address": "305 Maple Road, Brookline, MA",
                "list_price": 715000,
                "status": "pending",
                "type": "Listing",
                "listing_agent_id": agent_ids["sofia"],
                "closing_date": iso_day(60),
                "external_id": "HWA-DEMO-TX-04",
                "metadata": {"demo": True, "stage": "documents_out"},
            },
            {
                "id": transaction_ids["crest"],
                "address": "126 Crest Lane, Somerville, MA",
                "list_price": 690000,
                "status": "closed",
                "type": "Buyer representation",
                "buyer_agent_id": agent_ids["sofia"],
                "closing_date": iso_day(-10),
                "external_id": "HWA-DEMO-TX-05",
                "metadata": {"demo": True, "sold_price": 705000},
            },
        ],
    )

    sop_id = demo_id("sop-closing-compliance")
    workflow_id = demo_id("workflow-closing-compliance")
    upsert(
        "sops",
        [
            {
                "id": sop_id,
                "title": "Closing compliance review",
                "content": "Verify signatures, financing, inspection, title, commission, and archival requirements before close.",
                "category": "compliance",
                "is_automated": True,
                "trigger_conditions": {"transaction_status": "pending_close"},
            }
        ],
    )
    upsert(
        "workflows",
        [
            {
                "id": workflow_id,
                "name": "Contract-to-close",
                "description": "Coordinates deadlines and compliance from executed offer through disbursement.",
                "sop_id": sop_id,
            }
        ],
    )

    task_rows = [
        ("inspection", "Confirm inspection response", "in_progress", "urgent", -1, "willow"),
        ("wire", "Verify closing wire instructions", "compliance_review", "urgent", 2, "lakeview"),
        ("title", "Review title commitment", "todo", "high", 3, "lakeview"),
        ("disclosures", "Collect signed seller disclosures", "todo", "high", 5, "maple"),
        ("photos", "Schedule listing photography", "in_progress", "medium", 8, "maple"),
        ("deposit", "Confirm earnest-money receipt", "done", "high", -4, "willow"),
        ("luxury", "Approve luxury marketing package", "todo", "medium", 12, "harbor"),
        ("archive", "Archive final closing package", "done", "low", -7, "crest"),
    ]
    tasks = []
    for key, title, status, priority, due_offset, transaction_key in task_rows:
        tasks.append(
            {
                "id": demo_id(f"task-{key}"),
                "title": title,
                "description": "Demo task generated from the contract-to-close workflow.",
                "status": status,
                "priority": priority,
                "due_date": iso_day(due_offset),
                "transaction_id": transaction_ids[transaction_key],
                "workflow_id": workflow_id,
            }
        )
    upsert("tasks", tasks)

    upsert(
        "commissions",
        [
            {
                "id": demo_id("commission-willow-maya"),
                "agent_id": agent_ids["maya"],
                "transaction_id": transaction_ids["willow"],
                "split_percent": 80,
                "cap_amount": 18000,
                "cap_progress": 12600,
                "amount": 17500,
                "status": "pending",
                "metadata": {"demo": True},
            },
            {
                "id": demo_id("commission-lakeview-jordan"),
                "agent_id": agent_ids["jordan"],
                "transaction_id": transaction_ids["lakeview"],
                "split_percent": 75,
                "cap_amount": 18000,
                "cap_progress": 9800,
                "amount": 23343.75,
                "status": "approved",
                "metadata": {"demo": True},
            },
            {
                "id": demo_id("commission-harbor-ethan"),
                "agent_id": agent_ids["ethan"],
                "transaction_id": transaction_ids["harbor"],
                "split_percent": 85,
                "cap_amount": 20000,
                "cap_progress": 20000,
                "amount": 50575,
                "status": "pending",
                "metadata": {"demo": True},
            },
            {
                "id": demo_id("commission-crest-sofia"),
                "agent_id": agent_ids["sofia"],
                "transaction_id": transaction_ids["crest"],
                "split_percent": 70,
                "cap_amount": 18000,
                "cap_progress": 6300,
                "amount": 12337.50,
                "status": "paid",
                "disbursement_at": iso_time(48),
                "metadata": {"demo": True},
            },
            {
                "id": demo_id("commission-harbor-maya"),
                "agent_id": agent_ids["maya"],
                "transaction_id": transaction_ids["harbor"],
                "split_percent": 80,
                "amount": 47600,
                "status": "disputed",
                "metadata": {"demo": True, "reason": "Referral fee verification"},
            },
        ],
    )
    upsert(
        "compliance_records",
        [
            {
                "id": demo_id("compliance-sofia-license"),
                "agent_id": agent_ids["sofia"],
                "type": "real_estate_license",
                "status": "expiring_soon",
                "expiry_at": iso_day(24),
                "metadata": {"demo": True, "reminder_sent": True},
            },
            {
                "id": demo_id("compliance-jordan-eo"),
                "agent_id": agent_ids["jordan"],
                "type": "errors_and_omissions",
                "status": "expiring_soon",
                "expiry_at": iso_day(28),
                "metadata": {"demo": True, "reminder_sent": False},
            },
        ],
    )

    activity_rows = [
        ("workflow-created-tasks", "Created closing checklist from SOP", "transaction", transaction_ids["lakeview"], "mcp-agent", 1),
        ("commission-approved", "Approved Jordan Blake commission", "transaction", transaction_ids["lakeview"], "user", 3),
        ("license-reminder", "Flagged Sofia Martinez license renewal", "agent", agent_ids["sofia"], "system", 6),
        ("inspection-updated", "Updated inspection deadline", "transaction", transaction_ids["willow"], "user", 9),
        ("agent-onboarding", "Started Ava Patel onboarding", "agent", agent_ids["ava"], "mcp-agent", 14),
        ("closing-archived", "Archived completed closing package", "transaction", transaction_ids["crest"], "system", 28),
    ]
    upsert(
        "activity_log",
        [
            {
                "id": demo_id(f"activity-{key}"),
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "actor_type": actor_type,
                "details": {"demo": True},
                "created_at": iso_time(hours_ago),
            }
            for key, action, entity_type, entity_id, actor_type, hours_ago in activity_rows
        ],
    )

    print("\nDemo data is ready. No existing non-demo rows were deleted.")


if __name__ == "__main__":
    main()
