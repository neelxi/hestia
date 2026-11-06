"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";

export async function createClientAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      status: (formData.get("status") as string) || "active",
      owner_name: (formData.get("owner_name") as string) || null,
      location: (formData.get("location") as string) || null,
      size_agents: formData.get("size_agents")
        ? parseInt(formData.get("size_agents") as string, 10)
        : null,
      annual_gci: formData.get("annual_gci")
        ? parseFloat(formData.get("annual_gci") as string)
        : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  void logActivity("user", "client_created", "client", data.id, {
    name: formData.get("name"),
  }, profile.id);

  redirect(`/team/clients/${data.id}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      status: (formData.get("status") as string) || "active",
      owner_name: (formData.get("owner_name") as string) || null,
      location: (formData.get("location") as string) || null,
      size_agents: formData.get("size_agents")
        ? parseInt(formData.get("size_agents") as string, 10)
        : null,
      annual_gci: formData.get("annual_gci")
        ? parseFloat(formData.get("annual_gci") as string)
        : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  void logActivity("user", "client_updated", "client", id, undefined, profile.id);

  redirect(`/team/clients/${id}`);
}

export async function archiveClientAction(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  void logActivity("user", "client_archived", "client", id, undefined, profile.id);

  redirect("/team/clients");
}
