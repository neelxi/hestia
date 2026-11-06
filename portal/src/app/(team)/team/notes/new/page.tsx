import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { createNoteAction } from "@/app/actions/notes";

const NOTE_TYPES = [
  { value: "note", label: "Note" },
  { value: "meeting_transcript", label: "Meeting transcript" },
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
];

export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; project_id?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { client_id, project_id } = await searchParams;
  const supabase = await createClient();

  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
  ]);

  const clients = clientsRes.data ?? [];
  const projects = projectsRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={
          client_id
            ? `/team/clients/${client_id}`
            : project_id
              ? `/team/projects/${project_id}`
              : "/team/clients"
        }
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Note</h1>
        <p className="text-muted-foreground">
          Create a new note, meeting transcript, email, or call record.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNoteAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={client_id ?? ""}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">— Select client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project</Label>
                <select
                  id="project_id"
                  name="project_id"
                  defaultValue={project_id ?? ""}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">— Select project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue="note"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  name="source"
                  defaultValue="manual"
                  placeholder="manual, integration, etc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                name="content"
                rows={6}
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs"
                placeholder="Note content..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create Note</Button>
              <Button type="button" variant="outline" asChild>
                <Link
                  href={
                    client_id
                      ? `/team/clients/${client_id}`
                      : project_id
                        ? `/team/projects/${project_id}`
                        : "/team/clients"
                  }
                >
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
