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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getPortalMode } from "@/lib/portal-mode";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const priorityVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  compliance_review: "Compliance Review",
  done: "Done",
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

interface TaskListRow {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  profiles?: { display_name: string } | null;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    project_id?: string;
    client_id?: string;
    transaction_id?: string;
    assignee_id?: string;
    status?: string;
    priority?: string;
  }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { project_id, client_id, transaction_id, assignee_id, status, priority } =
    await searchParams;

  const supabase = await createClient();
  const isBrokerage = getPortalMode() === "brokerage";
  const statusGroups = isBrokerage
    ? ["todo", "in_progress", "compliance_review", "done"]
    : ["todo", "in_progress", "review", "done"];

  let query = isBrokerage
    ? supabase
        .from("tasks")
        .select("*, profiles:assignee_id(display_name), transactions(address)")
        .order("due_date", { ascending: true, nullsFirst: false })
    : supabase
        .from("tasks")
        .select("*, profiles:assignee_id(display_name), projects(name), clients(name)")
        .order("due_date", { ascending: true, nullsFirst: false });

  if (isBrokerage && transaction_id) query = query.eq("transaction_id", transaction_id);
  if (!isBrokerage && project_id) query = query.eq("project_id", project_id);
  if (!isBrokerage && client_id) query = query.eq("client_id", client_id);
  if (assignee_id) query = query.eq("assignee_id", assignee_id);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data: tasks } = await query;

  const [clientsRes, projectsRes, transactionsRes, profilesRes] = await Promise.all([
    isBrokerage ? Promise.resolve({ data: [] }) : supabase.from("clients").select("id, name").order("name"),
    isBrokerage ? Promise.resolve({ data: [] }) : supabase.from("projects").select("id, name").order("name"),
    isBrokerage ? supabase.from("transactions").select("id, address").order("address") : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, display_name").order("display_name"),
  ]);

  const clients = clientsRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const transactions = transactionsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  const allTasks = (tasks ?? []) as unknown as TaskListRow[];

  const grouped = Object.fromEntries(
    statusGroups.map((s) => [s, allTasks.filter((t) => t.status === s)])
  );

  function renderTaskTable(taskList: typeof allTasks) {
    if (taskList.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No tasks in this status.
        </p>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskList.map((t) => {
            const assigneeName =
              t.profiles &&
              typeof t.profiles === "object" &&
              "display_name" in (t.profiles as Record<string, unknown>)
                ? (t.profiles as { display_name: string }).display_name
                : "Unassigned";

            return (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link href={`/team/tasks/${t.id}`} className="hover:underline">
                    {t.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant[t.priority] ?? "secondary"}>
                    {t.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {assigneeName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.due_date ? formatDate(t.due_date) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{statusLabels[t.status] ?? t.status}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {isBrokerage
              ? "Track closing, compliance, and operational work across transactions."
              : "Track and manage tasks across all projects."}
          </p>
        </div>
        <Button asChild>
          <Link href="/team/tasks/new">
            <Plus className="mr-2 size-4" />
            Add Task
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Filters</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex flex-wrap items-center gap-2" method="get" action="/team/tasks">
              {isBrokerage ? (
                <select
                  name="transaction_id"
                  defaultValue={transaction_id ?? ""}
                  className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
                >
                  <option value="">All transactions</option>
                  {transactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>{transaction.address}</option>
                  ))}
                </select>
              ) : (
                <>
                  <select
                    name="project_id"
                    defaultValue={project_id ?? ""}
                    className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
                  >
                    <option value="">All projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    name="client_id"
                    defaultValue={client_id ?? ""}
                    className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
                  >
                    <option value="">All clients</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </>
              )}
              <select
                name="assignee_id"
                defaultValue={assignee_id ?? ""}
                className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
              >
                <option value="">All assignees</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={status ?? ""}
                className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
              >
                <option value="">All statuses</option>
                {statusGroups.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
              <select
                name="priority"
                defaultValue={priority ?? ""}
                className="border-input bg-background h-9 rounded-md border px-3 py-1 text-sm"
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Button type="submit" variant="secondary" size="sm">
                Apply
              </Button>
            </form>
            {(project_id || client_id || transaction_id || assignee_id || status || priority) && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/team/tasks">Clear</Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        {statusGroups.map((s) => (
          <Card key={s}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {statusLabels[s]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grouped[s].length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="todo">
        <TabsList>
          {statusGroups.map((s) => (
            <TabsTrigger key={s} value={s}>
              {statusLabels[s]} ({grouped[s].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {statusGroups.map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {renderTaskTable(grouped[s])}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
