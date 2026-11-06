"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const NOTE_TYPES = ["note", "meeting_transcript", "email", "call"] as const;

export async function createNoteAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const clientId = (formData.get("client_id") as string) || null;
  const projectId = (formData.get("project_id") as string) || null;
  const type = (formData.get("type") as string) || "note";
  const content = (formData.get("content") as string) || "";
  const source = (formData.get("source") as string) || "manual";

  if (!content.trim()) throw new Error("Content is required");
  if (!NOTE_TYPES.includes(type as (typeof NOTE_TYPES)[number])) {
    throw new Error("Invalid note type");
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      client_id: clientId,
      project_id: projectId,
      type,
      content: content.trim(),
      source,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  void logActivity("user", "note_created", "note", data.id, {
    type,
    client_id: clientId,
    project_id: projectId,
  }, profile.id);

  revalidatePath("/team/notes");
  if (clientId) revalidatePath(`/team/clients/${clientId}`);
  if (projectId) revalidatePath(`/team/projects/${projectId}`);

  redirect(clientId ? `/team/clients/${clientId}` : projectId ? `/team/projects/${projectId}` : "/team/notes");
}

export async function updateNoteAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Note ID required");

  const content = (formData.get("content") as string) || "";
  const type = (formData.get("type") as string) || "note";
  const source = (formData.get("source") as string) || "manual";

  if (!content.trim()) throw new Error("Content is required");
  if (!NOTE_TYPES.includes(type as (typeof NOTE_TYPES)[number])) {
    throw new Error("Invalid note type");
  }

  const supabase = await createSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("notes")
    .select("client_id, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new Error("Note not found");

  const { error } = await supabase
    .from("notes")
    .update({
      content: content.trim(),
      type,
      source,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  void logActivity("user", "note_updated", "note", id, undefined, profile.id);

  revalidatePath("/team/notes");
  if (existing.client_id) revalidatePath(`/team/clients/${existing.client_id}`);
  if (existing.project_id) revalidatePath(`/team/projects/${existing.project_id}`);

  redirect(
    existing.client_id
      ? `/team/clients/${existing.client_id}`
      : existing.project_id
        ? `/team/projects/${existing.project_id}`
        : "/team/notes"
  );
}
