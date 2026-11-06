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
import { updateNoteAction } from "@/app/actions/notes";

const NOTE_TYPES = [
  { value: "note", label: "Note" },
  { value: "meeting_transcript", label: "Meeting transcript" },
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
];

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !note) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={
          note.client_id
            ? `/team/clients/${note.client_id}`
            : note.project_id
              ? `/team/projects/${note.project_id}`
              : "/team/clients"
        }
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Note</h1>
        <p className="text-muted-foreground">
          Update the note content and metadata.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNoteAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={note.type}
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
                  defaultValue={note.source}
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
                defaultValue={note.content}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs"
                placeholder="Note content..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link
                  href={
                    note.client_id
                      ? `/team/clients/${note.client_id}`
                      : note.project_id
                        ? `/team/projects/${note.project_id}`
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
