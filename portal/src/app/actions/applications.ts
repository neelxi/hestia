"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";

export async function convertApplicationToLeadAction(applicationId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !app) throw new Error("Application not found");

  const { data: lead, error: leadError } = await supabase
    .from("warm_leads")
    .insert({
      contact_name: app.name,
      contact_email: app.email,
      contact_phone: app.phone ?? null,
      brokerage_name: app.brokerage ?? "Unknown",
      biggest_operational_challenge: app.challenge ?? null,
      source: "website_form",
      notes: app.notes ?? null,
    })
    .select("id")
    .single();

  if (leadError) throw new Error(leadError.message);

  void logActivity("user", "application_converted_to_lead", "application", applicationId, {
    warm_lead_id: lead.id,
  }, profile.id);

  redirect(`/team/leads/${lead.id}`);
}

export async function convertApplicationToClientAction(applicationId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseClient();

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !app) throw new Error("Application not found");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: app.brokerage ?? app.name,
      email: app.email,
      phone: app.phone ?? null,
      status: "active",
      owner_name: app.name,
    })
    .select("id")
    .single();

  if (clientError) throw new Error(clientError.message);

  void logActivity("user", "application_converted_to_client", "application", applicationId, {
    client_id: client.id,
  }, profile.id);

  redirect(`/team/clients/${client.id}`);
}
