import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { updateTaskAction } from "@/app/actions/tasks";
import { getPortalMode } from "@/lib/portal-mode";

const PRIORITIES = ["low", "medium", "high", "urgent"];
export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const isBrokerage = getPortalMode() === "brokerage";
  const statuses = isBrokerage
    ? ["todo", "in_progress", "compliance_review", "done"]
    : ["todo", "in_progress", "review", "done"];

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const [clientsRes, projectsRes, transactionsRes, workflowsRes, profilesRes] = await Promise.all([
    isBrokerage ? Promise.resolve({ data: [] }) : supabase.from("clients").select("id, name").order("name"),
    isBrokerage ? Promise.resolve({ data: [] }) : supabase.from("projects").select("id, name").order("name"),
    isBrokerage ? supabase.from("transactions").select("id, address").order("address") : Promise.resolve({ data: [] }),
    isBrokerage ? supabase.from("workflows").select("id, name").order("name") : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, display_name").order("display_name"),
  ]);

  const clients = clientsRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const transactions = transactionsRes.data ?? [];
  const workflows = workflowsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/team/tasks/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {task.title}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Task</h1>
        <p className="text-muted-foreground">
          Update task details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={(fd) => updateTaskAction(id, fd)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={task.title}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={task.description ?? ""}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs"
              />
            </div>
            {isBrokerage ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction</Label>
                  <select id="transaction_id" name="transaction_id" defaultValue={task.transaction_id ?? ""} className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs">
                    <option value="">— Select transaction —</option>
                    {transactions.map((transaction) => <option key={transaction.id} value={transaction.id}>{transaction.address}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow_id">Workflow</Label>
                  <select id="workflow_id" name="workflow_id" defaultValue={task.workflow_id ?? ""} className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs">
                    <option value="">— Select workflow —</option>
                    {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Project</Label>
                  <select id="project_id" name="project_id" defaultValue={task.project_id ?? ""} className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs">
                    <option value="">— Select project —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <select id="client_id" name="client_id" defaultValue={task.client_id ?? ""} className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs">
                    <option value="">— Select client —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={task.status}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={task.priority}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignee_id">Assignee</Label>
                <select
                  id="assignee_id"
                  name="assignee_id"
                  defaultValue={task.assignee_id ?? ""}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">— Unassigned —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={task.due_date ?? ""}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/team/tasks/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
