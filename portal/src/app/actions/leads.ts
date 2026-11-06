"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";

export async function updateWarmLeadAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();
  const assigneeId = formData.get("assignee_id") as string;
  const { error } = await supabase
    .from("warm_leads")
    .update({
      status: (formData.get("status") as string) || undefined,
      assignee_id: assigneeId ? assigneeId : null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  void logActivity("user", "lead_updated", "warm_lead", id, undefined, profile.id);

  redirect(`/team/leads/${id}`);
}

export async function convertLeadToClientAction(leadId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();

  const { data: lead, error: leadError } = await supabase
    .from("warm_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) throw new Error("Lead not found");
  if (lead.converted_to_client_id) throw new Error("Lead already converted");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: lead.brokerage_name,
      email: lead.contact_email,
      phone: lead.contact_phone ?? null,
      status: "active",
      owner_name: lead.contact_name,
      size_agents: lead.licensed_agents ?? null,
    })
    .select("id")
    .single();

  if (clientError) throw new Error(clientError.message);

  const { error: updateError } = await supabase
    .from("warm_leads")
    .update({
      converted_to_client_id: client.id,
      converted_at: new Date().toISOString(),
      status: "converted",
    })
    .eq("id", leadId);

  if (updateError) throw new Error(updateError.message);

  void logActivity("user", "lead_converted_to_client", "warm_lead", leadId, {
    client_id: client.id,
  }, profile.id);

  redirect(`/team/clients/${client.id}`);
}
