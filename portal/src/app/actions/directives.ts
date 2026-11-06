"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";

export async function createDirectiveAction(formData: FormData) {
  await requireRole(["admin"]);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("directives")
    .insert({
      title: formData.get("title") as string,
      content: (formData.get("content") as string) || "",
      category: (formData.get("category") as string) || "operations",
      is_automated: formData.get("is_automated") === "true",
      trigger_conditions: parseTriggerConditions(formData.get("trigger_conditions") as string),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/team/directives/${data.id}`);
}

export async function updateDirectiveAction(id: string, formData: FormData) {
  await requireRole(["admin"]);

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("directives")
    .update({
      title: formData.get("title") as string,
      content: (formData.get("content") as string) || "",
      category: (formData.get("category") as string) || "operations",
      is_automated: formData.get("is_automated") === "true",
      trigger_conditions: parseTriggerConditions(formData.get("trigger_conditions") as string),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/team/directives/${id}`);
}

function parseTriggerConditions(raw: string | null): Record<string, unknown> | null {
  if (!raw || raw.trim() === "") return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
