import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  CheckSquare,
  FileText,
  CalendarDays,
  Clock,
  Activity,
} from "lucide-react";

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">No client record found</h2>
        <p className="text-muted-foreground mt-2">
          Your email isn&apos;t linked to a client account. Contact your account
          manager.
        </p>
      </div>
    );
  }

  const [projectsRes, tasksRes, documentsRes, meetingsRes, upcomingRes, activityRes] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("status", "active"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .in("status", ["todo", "in_progress"]),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id),
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("type", "meeting_transcript"),
      supabase
        .from("tasks")
        .select("*")
        .eq("client_id", client.id)
        .in("status", ["todo", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "client")
        .eq("entity_id", client.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const stats = [
    { label: "Active Projects", value: projectsRes.count ?? 0, icon: FolderKanban },
    { label: "Open Tasks", value: tasksRes.count ?? 0, icon: CheckSquare },
    { label: "Documents", value: documentsRes.count ?? 0, icon: FileText },
    { label: "Meetings", value: meetingsRes.count ?? 0, icon: CalendarDays },
  ];

  const upcomingTasks = upcomingRes.data ?? [];
  const recentActivity = activityRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {client.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.label}
              </CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>
              Tasks assigned or linked to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming tasks.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-4 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due{" "}
                          {new Date(task.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        task.priority === "urgent" || task.priority === "high"
                          ? "destructive"
                          : "outline"
                      }
                      className="shrink-0"
                    >
                      {task.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates on your account</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}{" "}
                        &middot; {entry.actor_type}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
