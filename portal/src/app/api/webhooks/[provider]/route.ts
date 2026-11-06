import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Generic webhook receiver for any integration provider.
 * When you add a provider (e.g. Smartlead), insert a row into integration_providers
 * with slug = [provider], then create an integration with webhook_secret set.
 * Configure the external tool to POST to /api/webhooks/[provider] with the secret
 * in header x-webhook-secret (or query param secret). Events are stored in
 * integration_events for processing (e.g. via a directive or execution script).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerSlug } = await params;
  const webhookSecret =
    request.headers.get("x-webhook-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook secret" },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  const { data: provider } = await supabase
    .from("integration_providers")
    .select("id")
    .eq("slug", providerSlug)
    .single();

  if (!provider) {
    return NextResponse.json(
      { error: "Unknown provider" },
      { status: 404 }
    );
  }

  const { data: integration } = await supabase
    .from("integrations")
    .select("id")
    .eq("provider_id", provider.id)
    .eq("webhook_secret", webhookSecret)
    .eq("status", "active")
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "No matching integration or invalid secret" },
      { status: 403 }
    );
  }

  const eventType =
    (payload as Record<string, unknown>)?.type ??
    (payload as Record<string, unknown>)?.event ??
    "webhook";

  await supabase.from("integration_events").insert({
    integration_id: integration.id,
    event_type: String(eventType),
    raw_payload: payload as Record<string, unknown>,
    processed_status: "pending",
  });

  return NextResponse.json({ ok: true });
}
