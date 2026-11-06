"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CapacityFilters({
  projects,
  clients,
}: {
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  return (
    <form className="flex flex-wrap items-end gap-4" action="/team/capacity" method="get">
      <div className="space-y-1.5">
        <Label className="text-xs">Project</Label>
        <select
          name="project_id"
          defaultValue={projectId}
          className="flex h-9 min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Client</Label>
        <select
          name="client_id"
          defaultValue={clientId}
          className="flex h-9 min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/team/capacity">Clear</Link>
      </Button>
    </form>
  );
}
