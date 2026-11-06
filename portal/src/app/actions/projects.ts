"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";

export async function createProjectAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const clientId = formData.get("client_id") as string;
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientId || null,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
      budget: formData.get("budget")
        ? parseFloat(formData.get("budget") as string)
        : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  void logActivity("user", "project_created", "project", data.id, {
    name: formData.get("name"),
  }, profile.id);

  redirect(`/team/projects/${data.id}`);
}

export async function updateProjectAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({
      client_id: (formData.get("client_id") as string) || null,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "active",
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
      budget: formData.get("budget")
        ? parseFloat(formData.get("budget") as string)
        : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  void logActivity("user", "project_updated", "project", id, undefined, profile.id);

  redirect(`/team/projects/${id}`);
}
