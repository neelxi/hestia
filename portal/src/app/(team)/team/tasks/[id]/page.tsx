import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar, User } from "lucide-react";
import { TaskStatusForm } from "./task-status-form";
import { getPortalMode } from "@/lib/portal-mode";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  project_id?: string | null;
  client_id?: string | null;
  transaction_id?: string | null;
  profiles?: { display_name: string } | null;
  projects?: { name: string } | null;
  clients?: { name: string } | null;
  transactions?: { address: string } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const isBrokerage = getPortalMode() === "brokerage";

  const taskResult = isBrokerage
    ? await supabase
        .from("tasks")
        .select("*, profiles:assignee_id(display_name), transactions(address)")
        .eq("id", id)
        .single()
    : await supabase
        .from("tasks")
        .select("*, profiles:assignee_id(display_name), projects(name), clients(name)")
        .eq("id", id)
        .single();
  const task = taskResult.data as unknown as TaskDetail | null;

  if (!task) notFound();

  const assigneeName =
    task.profiles && typeof task.profiles === "object" && "display_name" in (task.profiles as Record<string, unknown>)
      ? (task.profiles as { display_name: string }).display_name
      : null;
  const projectName =
    task.projects && typeof task.projects === "object" && "name" in (task.projects as Record<string, unknown>)
      ? (task.projects as { name: string }).name
      : null;
  const clientName =
    task.clients && typeof task.clients === "object" && "name" in (task.clients as Record<string, unknown>)
      ? (task.clients as { name: string }).name
      : null;
  const transactionAddress =
    task.transactions &&
    typeof task.transactions === "object" &&
    "address" in (task.transactions as Record<string, unknown>)
      ? (task.transactions as { address: string }).address
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/team/tasks"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Back to Tasks
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            <Badge variant={priorityVariant[task.priority] ?? "secondary"}>
              {task.priority}
            </Badge>
            <TaskStatusForm taskId={id} currentStatus={task.status} isBrokerage={isBrokerage} />
          </div>
          {task.description && (
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {isBrokerage && task.transaction_id && (
              <span className="flex items-center gap-1.5">
                Transaction:{" "}
                <Link href={`/team/transactions/${task.transaction_id}`} className="font-medium hover:underline">
                  {transactionAddress ?? "—"}
                </Link>
              </span>
            )}
            {!isBrokerage && task.project_id && (
              <span className="flex items-center gap-1.5">
                Project:{" "}
                <Link
                  href={`/team/projects/${task.project_id}`}
                  className="font-medium hover:underline"
                >
                  {projectName ?? "—"}
                </Link>
              </span>
            )}
            {!isBrokerage && task.client_id && (
              <span className="flex items-center gap-1.5">
                Client:{" "}
                <Link
                  href={`/team/clients/${task.client_id}`}
                  className="font-medium hover:underline"
                >
                  {clientName ?? "—"}
                </Link>
              </span>
            )}
            {assigneeName && (
              <span className="flex items-center gap-1.5">
                <User className="size-3.5" />
                {assigneeName}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Due {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/team/tasks/${id}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </Button>
      </div>

    </div>
  );
}
