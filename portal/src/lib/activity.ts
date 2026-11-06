"use server";

import { createClient } from "@/lib/supabase/server";

export type ActorType = "user" | "mcp-agent" | "system";

export async function logActivity(
  actorType: ActorType,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
  actorId?: string | null
): Promise<void> {
  const supabase = await createClient();

  let resolvedActorId: string | null = actorId ?? null;
  if (actorType === "user" && !resolvedActorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      resolvedActorId = profile?.id ?? null;
    }
  }

  await supabase.from("activity_log").insert({
    actor_id: resolvedActorId,
    actor_type: actorType,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? {},
  });
}
