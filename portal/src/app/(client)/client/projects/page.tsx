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
import { CheckSquare } from "lucide-react";

const statusVariant = (s: string) => {
  switch (s) {
    case "active":
    case "in_progress":
      return "default" as const;
    case "completed":
    case "done":
      return "secondary" as const;
    case "urgent":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export default async function ClientProjectsPage() {
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
          Your email isn&apos;t linked to a client account.
        </p>
      </div>
    );
  }

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", client.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
  ]);

  const allProjects = projects ?? [];
  const allTasks = tasks ?? [];
  const tasksByProject = new Map<string, typeof allTasks>();
  for (const task of allTasks) {
    if (!task.project_id) continue;
    const list = tasksByProject.get(task.project_id) ?? [];
    list.push(task);
    tasksByProject.set(task.project_id, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1">
          Your projects and their associated tasks.
        </p>
      </div>

      {allProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {allProjects.map((project) => {
            const projectTasks = tasksByProject.get(project.id) ?? [];
            const openCount = projectTasks.filter(
              (t) => t.status !== "done" && t.status !== "completed"
            ).length;

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckSquare className="size-3" />
                        {openCount} open / {projectTasks.length} total
                      </span>
                      <Badge variant={statusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {projectTasks.length > 0 && (
                  <CardContent>
                    <ul className="divide-y">
                      {projectTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`size-2 shrink-0 rounded-full ${
                                task.status === "done" ||
                                task.status === "completed"
                                  ? "bg-muted-foreground/40"
                                  : "bg-primary"
                              }`}
                            />
                            <span
                              className={`text-sm truncate ${
                                task.status === "done" ||
                                task.status === "completed"
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.due_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            )}
                            <Badge
                              variant={statusVariant(task.status)}
                              className="text-[10px]"
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
