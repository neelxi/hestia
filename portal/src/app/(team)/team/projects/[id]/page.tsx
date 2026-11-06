import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Calendar, DollarSign, Download, Trash2, Upload, Plus } from "lucide-react";
import { uploadDocument, deleteDocument } from "@/app/actions/documents";
import { getClientLabel } from "@/lib/terminology";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  discovery: "outline",
  implementation: "secondary",
  active: "default",
  on_hold: "outline",
  completed: "secondary",
  archived: "destructive",
};

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/transactions");

  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const clientName =
    project.clients && typeof project.clients === "object"
      ? (project.clients as { name: string }).name
      : null;

  const [tasksRes, documentsRes, notesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const tasks = tasksRes.data ?? [];
  const documents = documentsRes.data ?? [];
  const notes = notesRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={statusVariant[project.status] ?? "secondary"}>
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {project.client_id && (
              <span>
                {getClientLabel(true)}:{" "}
                <Link
                  href={`/team/clients/${project.client_id}`}
                  className="font-medium hover:underline"
                >
                  {clientName ?? "—"}
                </Link>
              </span>
            )}
            {project.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(project.start_date)}
                {project.end_date && ` – ${formatDate(project.end_date)}`}
              </span>
            )}
            {project.budget != null && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="size-3.5" />
                ${project.budget.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/team/projects/${id}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {tasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No tasks yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => (
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
                        <TableCell>
                          <Badge variant="outline">{t.status}</Badge>
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
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {documents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No documents yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {d.mime_type ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {d.size_bytes
                            ? `${(d.size_bytes / 1024).toFixed(1)} KB`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(d.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Button asChild size="sm">
                  <Link
                    href={`/team/notes/new?client_id=${project.client_id ?? ""}&project_id=${id}`}
                  >
                    <Plus className="mr-2 size-4" />
                    Add note
                  </Link>
                </Button>
              </div>
              {notes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No notes yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-md border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{n.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/team/notes/${n.id}/edit`}>
                            <Pencil className="mr-1 size-3.5" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
