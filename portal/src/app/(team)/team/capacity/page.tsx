import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import type { Profile, Task } from "@/types/database";
import { CapacityFilters } from "./capacity-filters";

export default async function CapacityPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string; client_id?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const supabase = await createClient();

  const [membersRes, tasksRes, projectsRes, clientsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("display_name"),
    supabase.from("tasks").select("assignee_id, status, due_date, project_id, client_id"),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const members = (membersRes.data ?? []) as Profile[];
  const tasksRaw = (tasksRes.data ?? []) as Pick<
    Task,
    "assignee_id" | "status" | "due_date" | "project_id" | "client_id"
  >[];
  const projects = (projectsRes.data ?? []) as { id: string; name: string }[];
  const clients = (clientsRes.data ?? []) as { id: string; name: string }[];

  let tasks = tasksRaw;
  if (params.project_id) {
    tasks = tasks.filter((t) => t.project_id === params.project_id);
  }
  if (params.client_id) {
    tasks = tasks.filter((t) => t.client_id === params.client_id);
  }

  const now = new Date();

  const memberStats = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
    const total = memberTasks.length;
    const completed = memberTasks.filter((t) => t.status === "done").length;
    const overdue = memberTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== "done"
    ).length;

    return { member, total, completed, overdue };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Capacity</h1>
        <p className="text-muted-foreground">
          See workload distribution across your team.
        </p>
      </div>

      <CapacityFilters projects={projects} clients={clients} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {tasks.filter(
                (t) =>
                  t.due_date &&
                  new Date(t.due_date) < now &&
                  t.status !== "done"
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Workload</CardTitle>
          <CardDescription>
            Task counts per team member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No team members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberStats.map(({ member, total, completed, overdue }) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.display_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{total}</TableCell>
                    <TableCell className="text-right">{completed}</TableCell>
                    <TableCell className="text-right">
                      {overdue > 0 ? (
                        <Badge variant="destructive">{overdue}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
