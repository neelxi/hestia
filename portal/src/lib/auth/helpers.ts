import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data as Profile | null;
});

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    throw new Error("Unauthorized");
  }
  return profile;
}
