"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export async function createAgentAction(formData: FormData) {
  const profile = await requireRole(["admin", "team"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agents")
    .insert({
      first_name: String(formData.get("first_name") ?? "").trim(),
      last_name: String(formData.get("last_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      license_number: String(formData.get("license_number") ?? "").trim() || null,
      license_expiry: String(formData.get("license_expiry") ?? "") || null,
      eo_policy_expiry: String(formData.get("eo_policy_expiry") ?? "") || null,
      team_id: String(formData.get("team_id") ?? "") || null,
      status: String(formData.get("status") ?? "active"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logActivity("user", "agent_created", "agent", data.id, {
    email: formData.get("email"),
  }, profile.id);

  redirect(`/team/agents/${data.id}`);
}
