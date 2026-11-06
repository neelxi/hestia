"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";

function taskRelations(formData: FormData) {
  if (getPortalMode() === "brokerage") {
    return {
      transaction_id: (formData.get("transaction_id") as string) || null,
      workflow_id: (formData.get("workflow_id") as string) || null,
    };
  }
  return {
    project_id: (formData.get("project_id") as string) || null,
    client_id: (formData.get("client_id") as string) || null,
  };
}

export async function createTaskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...taskRelations(formData),
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "todo",
      priority: (formData.get("priority") as string) || "medium",
      assignee_id: (formData.get("assignee_id") as string) || null,
      due_date: (formData.get("due_date") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logActivity("user", "task_created", "task", data.id, {
    title: formData.get("title"),
  }, profile.id);

  redirect(`/team/tasks/${data.id}`);
}

export async function updateTaskAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      ...taskRelations(formData),
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as string) || "todo",
      priority: (formData.get("priority") as string) || "medium",
      assignee_id: (formData.get("assignee_id") as string) || null,
      due_date: (formData.get("due_date") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity("user", "task_updated", "task", id, undefined, profile.id);

  redirect(`/team/tasks/${id}`);
}

export async function updateTaskStatusAction(id: string, status: string) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity("user", "task_status_updated", "task", id, { status }, profile.id);
}
