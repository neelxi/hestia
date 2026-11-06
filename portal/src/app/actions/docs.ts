"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createDocAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    throw new Error("Only admins can create docs.");
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  const slug = (formData.get("slug") as string)?.trim() || slugify(title);
  const content = (formData.get("content") as string) ?? "";
  const category = (formData.get("category") as string) ?? "general";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docs")
    .insert({ title, slug, content, category })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/team/docs");
  redirect(`/team/docs/${data.id}`);
}

export async function updateDocAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    throw new Error("Only admins can update docs.");
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  const slug = (formData.get("slug") as string)?.trim() || slugify(title);
  const content = (formData.get("content") as string) ?? "";
  const category = (formData.get("category") as string) ?? "general";

  const supabase = await createClient();
  const { error } = await supabase
    .from("docs")
    .update({ title, slug, content, category })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/team/docs");
  revalidatePath(`/team/docs/${id}`);
  redirect(`/team/docs/${id}`);
}

export async function deleteDocAction(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    throw new Error("Only admins can delete docs.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("docs").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/team/docs");
  redirect("/team/docs");
}
