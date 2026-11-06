import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { Mail, Phone, Calendar, Plus, Pencil, Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchiveClientForm } from "./archive-client-form";
import { getClientLabel, getProjectLabel } from "@/lib/terminology";
import { uploadDocument, deleteDocument } from "@/app/actions/documents";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  prospect: "outline",
};

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> =
  {
    low: "secondary",
    medium: "secondary",
    high: "destructive",
    urgent: "destructive",
  };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const [projectsRes, tasksRes, documentsRes, notesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const documents = documentsRes.data ?? [];
  const notes = notesRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {client.name}
            </h1>
            <Badge variant={statusVariant[client.status] ?? "secondary"}>
              {client.status}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {client.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Since {formatDate(client.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/team/clients/${id}/edit`}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/team/projects/new?client_id=${id}`}>
              <Plus className="mr-2 size-4" />
              Add {getProjectLabel(true)}
            </Link>
          </Button>
          <ArchiveClientForm clientId={id} />
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            {getProjectLabel(false)} ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {projects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No projects yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link href={`/team/projects/${p.id}`} className="hover:underline">
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.start_date ? formatDate(p.start_date) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.end_date ? formatDate(p.end_date) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                          <Badge
                            variant={
                              priorityVariant[t.priority] ?? "secondary"
                            }
                          >
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
              <form action={uploadDocument} className="mb-4 flex flex-wrap items-end gap-2">
                <input type="hidden" name="client_id" value={id} />
                <div className="flex flex-col gap-1">
                  <label htmlFor="doc-file" className="text-sm font-medium">
                    Upload document
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="doc-file"
                      name="file"
                      type="file"
                      required
                      className="border-input bg-background text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
                    />
                    <Button type="submit" size="sm">
                      <Upload className="mr-2 size-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              </form>
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
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/api/documents/${d.id}/download`}
                            className="hover:underline"
                          >
                            {d.name}
                          </Link>
                        </TableCell>
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/api/documents/${d.id}/download`}
                                className="size-8"
                              >
                                <Download className="size-4" />
                                <span className="sr-only">Download {d.name}</span>
                              </Link>
                            </Button>
                            <form action={deleteDocument} className="inline">
                              <input type="hidden" name="id" value={d.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete {d.name}</span>
                              </Button>
                            </form>
                          </div>
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
                  <Link href={`/team/notes/new?client_id=${id}`}>
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
