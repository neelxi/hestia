import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityFilters } from "./activity-filters";

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getEntityHref(a: { entity_type: string; entity_id: string | null }) {
  if (!a.entity_id) return null;
  const t = a.entity_type;
  if (t === "client") return `/team/clients/${a.entity_id}`;
  if (t === "project") return `/team/projects/${a.entity_id}`;
  if (t === "task") return `/team/tasks/${a.entity_id}`;
  if (t === "warm_lead") return `/team/leads/${a.entity_id}`;
  if (t === "application") return `/team/applications/${a.entity_id}`;
  if (t === "agent") return `/team/agents/${a.entity_id}`;
  if (t === "transaction") return `/team/transactions/${a.entity_id}`;
  return null;
}

const actorVariant: Record<string, "default" | "secondary" | "outline"> = {
  user: "default",
  "mcp-agent": "secondary",
  system: "outline",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; actor_type?: string; date_from?: string; date_to?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.entity_type) {
    query = query.eq("entity_type", params.entity_type);
  }
  if (params.actor_type) {
    query = query.eq("actor_type", params.actor_type);
  }
  if (params.date_from) {
    query = query.gte("created_at", `${params.date_from}T00:00:00Z`);
  }
  if (params.date_to) {
    query = query.lte("created_at", `${params.date_to}T23:59:59Z`);
  }

  const { data: activities } = await query;
  const entries = activities ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          A chronological feed of everything happening in your workspace.
        </p>
      </div>

      <ActivityFilters />

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((a) => {
                  const href = getEntityHref(a);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {href ? (
                          <Link href={href} className="hover:underline">
                            {a.action}
                          </Link>
                        ) : (
                          a.action
                        )}
                      </TableCell>
                      <TableCell>
                        {href ? (
                          <Link href={href}>
                            <Badge variant="outline" className="hover:bg-muted">
                              {a.entity_type}
                            </Badge>
                          </Link>
                        ) : (
                          <Badge variant="outline">{a.entity_type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actorVariant[a.actor_type] ?? "outline"}>
                          {a.actor_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelative(a.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
