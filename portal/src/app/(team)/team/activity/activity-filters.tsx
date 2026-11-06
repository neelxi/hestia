"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ENTITY_TYPES = ["client", "project", "task", "warm_lead", "application", "note", "document", "directive"];
const ACTOR_TYPES = ["user", "mcp-agent", "system"];

export function ActivityFilters() {
  const searchParams = useSearchParams();
  const entityType = searchParams.get("entity_type") ?? "";
  const actorType = searchParams.get("actor_type") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";

  return (
    <form className="flex flex-wrap items-end gap-4" action="/team/activity" method="get">
      <div className="space-y-1.5">
        <Label className="text-xs">Entity type</Label>
        <select
          name="entity_type"
          defaultValue={entityType}
          className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Actor type</Label>
        <select
          name="actor_type"
          defaultValue={actorType}
          className="flex h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {ACTOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">From date</Label>
        <Input type="date" name="date_from" defaultValue={dateFrom} className="w-[140px]" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">To date</Label>
        <Input type="date" name="date_to" defaultValue={dateTo} className="w-[140px]" />
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/team/activity">Clear</Link>
      </Button>
    </form>
  );
}
