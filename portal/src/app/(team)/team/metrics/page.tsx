import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, FolderKanban, CheckSquare, UserCheck, Home, DollarSign } from "lucide-react";
import { ProjectsByStatusChart, TasksCompletedChart } from "./metrics-charts";

export default async function MetricsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const isBrokerage = getPortalMode() === "brokerage";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const stats = isBrokerage
    ? await (async () => {
        const [agentsRes, transactionsRes, completedRes, membersRes, commissionsRes] =
          await Promise.all([
            supabase.from("agents").select("id", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("transactions").select("id", { count: "exact", head: true }).in("status", ["active", "pending_close"]),
            supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "done").gte("updated_at", startOfMonth.toISOString()),
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("commissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
          ]);
        return [
          { label: "Active Agents", value: agentsRes.count ?? 0, description: "Licensed agents", icon: Users },
          { label: "Active Transactions", value: transactionsRes.count ?? 0, description: "In pipeline", icon: Home },
          { label: "Tasks Completed", value: completedRes.count ?? 0, description: "This month", icon: CheckSquare },
          { label: "Pending Commissions", value: commissionsRes.count ?? 0, description: "Awaiting processing", icon: DollarSign },
        ];
      })()
    : await (async () => {
        const [clientsRes, projectsRes, completedRes, membersRes] =
          await Promise.all([
            supabase.from("clients").select("id", { count: "exact", head: true }),
            supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "done").gte("updated_at", startOfMonth.toISOString()),
            supabase.from("profiles").select("id", { count: "exact", head: true }),
          ]);
        return [
          { label: "Total Clients", value: clientsRes.count ?? 0, description: "All-time client count", icon: Users },
          { label: "Active Projects", value: projectsRes.count ?? 0, description: "Currently in progress", icon: FolderKanban },
          { label: "Tasks Completed", value: completedRes.count ?? 0, description: "This month", icon: CheckSquare },
          { label: "Team Members", value: membersRes.count ?? 0, description: "Total profiles", icon: UserCheck },
        ];
      })();

  // Charts data (Hestia only for projects/tasks; brokerage uses tasks)
  let projectsByStatus: { status: string; count: number }[] = [];
  let tasksCompletedByMonth: { month: string; count: number }[] = [];

  if (!isBrokerage) {
    const { data: projects } = await supabase.from("projects").select("status");
    const statusCounts: Record<string, number> = {};
    (projects ?? []).forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    });
    projectsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("updated_at")
      .eq("status", "done")
      .gte("updated_at", sixMonthsAgo.toISOString());
    const monthCounts: Record<string, number> = {};
    (completedTasks ?? []).forEach((t) => {
      const d = new Date(t.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[key] = (monthCounts[key] ?? 0) + 1;
    });
    tasksCompletedByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("updated_at")
      .eq("status", "done")
      .gte("updated_at", sixMonthsAgo.toISOString());
    const monthCounts: Record<string, number> = {};
    (completedTasks ?? []).forEach((t) => {
      const d = new Date(t.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[key] = (monthCounts[key] ?? 0) + 1;
    });
    tasksCompletedByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <p className="text-muted-foreground">
          Key performance indicators for your business.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {!isBrokerage && (
          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
              <CardDescription>
                Distribution of projects across statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsByStatusChart data={projectsByStatus} />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Tasks Completed</CardTitle>
            <CardDescription>
              Tasks completed per month (last 6 months).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TasksCompletedChart data={tasksCompletedByMonth} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
