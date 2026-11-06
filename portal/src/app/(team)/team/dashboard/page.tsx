import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, FolderKanban, CheckSquare, DollarSign, Home, UserPlus, FileText } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const isBrokerage = getPortalMode() === "brokerage";

  if (isBrokerage) {
    const [agentsRes, transactionsRes, tasksRes, activityRes, upcomingRes, pendingCommissionsRes] =
      await Promise.all([
        supabase.from("agents").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("id", { count: "exact", head: true }).in("status", ["pending", "active", "pending_close"]),
        supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["todo", "in_progress", "compliance_review"]),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("tasks").select("*").in("status", ["todo", "in_progress"]).not("due_date", "is", null).order("due_date", { ascending: true }).limit(8),
        supabase.from("commissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

    const stats = [
      { label: "Active Agents", value: agentsRes.count ?? 0, icon: Users },
      { label: "Active Transactions", value: transactionsRes.count ?? 0, icon: Home },
      { label: "Open Tasks", value: tasksRes.count ?? 0, icon: CheckSquare },
      { label: "Pending Commissions", value: pendingCommissionsRes.count ?? 0, icon: DollarSign },
    ];

    const activities = activityRes.data ?? [];
    const upcomingTasks = upcomingRes.data ?? [];

    function getEntityHrefBrokerage(a: { entity_type: string; entity_id: string | null }) {
      if (!a.entity_id) return null;
      const t = a.entity_type;
      if (t === "agent") return `/team/agents/${a.entity_id}`;
      if (t === "transaction") return `/team/transactions/${a.entity_id}`;
      if (t === "task") return `/team/tasks/${a.entity_id}`;
      if (t === "warm_lead") return `/team/leads/${a.entity_id}`;
      if (t === "application") return `/team/applications/${a.entity_id}`;
      return null;
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your brokerage operations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => {
                    const href = getEntityHrefBrokerage(a);
                    const content = (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.entity_type}
                            {a.actor_type !== "system" && <> &middot; {a.actor_type}</>}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(a.created_at)}
                        </span>
                      </>
                    );
                    return href ? (
                      <Link key={a.id} href={href} className="flex items-center justify-between gap-4 rounded-md border px-4 py-3 hover:bg-muted/50 transition-colors">
                        {content}
                      </Link>
                    ) : (
                      <div key={a.id} className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTasks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          <Link href={`/team/tasks/${t.id}`} className="hover:underline">
                            {t.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"}>
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.due_date ? formatDate(t.due_date) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Hestia mode
  const [clientsRes, projectsRes, tasksRes, warmLeadsRes, applicationsRes, activityRes, upcomingRes] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["todo", "in_progress", "review"]),
      supabase.from("warm_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("tasks").select("*").in("status", ["todo", "in_progress"]).not("due_date", "is", null).order("due_date", { ascending: true }).limit(8),
    ]);

  const stats = [
    { label: "Total Clients", value: clientsRes.count ?? 0, icon: Users },
    { label: "Active Projects", value: projectsRes.count ?? 0, icon: FolderKanban },
    { label: "Open Tasks", value: tasksRes.count ?? 0, icon: CheckSquare },
    { label: "Warm Leads (new)", value: warmLeadsRes.count ?? 0, icon: UserPlus },
    { label: "Applications", value: applicationsRes.count ?? 0, icon: FileText },
  ];

  const activities = activityRes.data ?? [];
  const upcomingTasks = upcomingRes.data ?? [];

  function getEntityHref(a: { entity_type: string; entity_id: string | null }) {
    if (!a.entity_id) return null;
    const t = a.entity_type;
    if (t === "client") return `/team/clients/${a.entity_id}`;
    if (t === "project") return `/team/projects/${a.entity_id}`;
    if (t === "task") return `/team/tasks/${a.entity_id}`;
    if (t === "warm_lead") return `/team/leads/${a.entity_id}`;
    if (t === "application") return `/team/applications/${a.entity_id}`;
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your team&apos;s activity and workload.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity.
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => {
                  const href = getEntityHref(a);
                  const content = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.entity_type}
                          {a.actor_type !== "system" && (
                            <> &middot; {a.actor_type}</>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(a.created_at)}
                      </span>
                    </>
                  );
                  return href ? (
                    <Link key={a.id} href={href} className="flex items-center justify-between gap-4 rounded-md border px-4 py-3 hover:bg-muted/50 transition-colors">
                      {content}
                    </Link>
                  ) : (
                    <div key={a.id} className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming tasks.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <Link href={`/team/tasks/${t.id}`} className="hover:underline">
                          {t.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.priority === "urgent" || t.priority === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.due_date ? formatDate(t.due_date) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
