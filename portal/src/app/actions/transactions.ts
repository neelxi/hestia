"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export async function createTransactionAction(formData: FormData) {
  const profile = await requireRole(["admin", "team"]);
  const supabase = await createClient();

  const price = String(formData.get("list_price") ?? "").trim();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      address: String(formData.get("address") ?? "").trim(),
      list_price: price ? Number(price) : null,
      type: String(formData.get("type") ?? "").trim() || null,
      status: String(formData.get("status") ?? "pending"),
      listing_agent_id: String(formData.get("listing_agent_id") ?? "") || null,
      buyer_agent_id: String(formData.get("buyer_agent_id") ?? "") || null,
      closing_date: String(formData.get("closing_date") ?? "") || null,
      contingency_date: String(formData.get("contingency_date") ?? "") || null,
      inspection_deadline: String(formData.get("inspection_deadline") ?? "") || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logActivity("user", "transaction_created", "transaction", data.id, {
    address: formData.get("address"),
  }, profile.id);

  redirect(`/team/transactions/${data.id}`);
}
