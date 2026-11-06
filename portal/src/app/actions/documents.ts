"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const BUCKET = "documents";

export async function uploadDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const file = formData.get("file") as File;
  if (!file?.size) throw new Error("No file provided");

  const clientId = formData.get("client_id") as string;
  if (!clientId) throw new Error("Client is required");

  const projectId = (formData.get("project_id") as string) || null;

  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const baseName = file.name.replace(/\.[^/.]+$/, "") || "file";
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uuid = crypto.randomUUID();
  const storageName = ext ? `${uuid}_${safeName}.${ext}` : `${uuid}_${safeName}`;
  const filePath = `${clientId}/${storageName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      client_id: clientId,
      project_id: projectId,
      name: file.name,
      file_path: filePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw new Error(error.message);
  }

  void logActivity("user", "document_uploaded", "document", data.id, {
    name: file.name,
    client_id: clientId,
    project_id: projectId,
  }, profile.id);

  revalidatePath(`/team/clients/${clientId}`);
  if (projectId) revalidatePath(`/team/projects/${projectId}`);
  redirect(projectId ? `/team/projects/${projectId}` : `/team/clients/${clientId}`);
}

export async function deleteDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Document ID required");

  const supabase = await createSupabaseClient();
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, file_path, client_id, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !doc) throw new Error("Document not found");

  const storagePath = doc.file_path;

  const { error: deleteStorageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (deleteStorageError) {
    console.error("Storage delete error:", deleteStorageError);
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (deleteError) throw new Error(deleteError.message);

  void logActivity("user", "document_deleted", "document", id, {
    name: doc.file_path,
  }, profile.id);

  revalidatePath(`/team/clients/${doc.client_id}`);
  if (doc.project_id) revalidatePath(`/team/projects/${doc.project_id}`);
  revalidatePath("/client/documents");
}
