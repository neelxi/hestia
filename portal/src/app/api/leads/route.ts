import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_REDIRECT_ORIGINS = [
  "https://hestiaops.com",
  "https://www.hestiaops.com",
  "http://localhost",
  "http://127.0.0.1",
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Accepts form submissions from marketing lead magnet forms (blueprint, waitlist).
 * Stores data in Supabase warm_leads table. Returns 200 on success (client redirects).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text)) as Record<string, string>;
  } else if (contentType.includes("application/json")) {
    body = (await request.json()) as Record<string, string>;
  } else {
    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const formType = body.form_type?.trim() || "blueprint";
  const requestedRedirect =
    body._next ||
    body._redirect ||
    "https://hestiaops.com/thankyou";

  const allowedOrigins = [...ALLOWED_REDIRECT_ORIGINS, request.nextUrl.origin];
  const redirectUrl = allowedOrigins.some((o) =>
    requestedRedirect.startsWith(o)
  )
    ? requestedRedirect
    : `${request.nextUrl.origin}/thankyou`;

  if (formType === "waitlist") {
    const email = body.waitlist_email?.trim() || body.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const lead = {
      contact_name: "Waitlist",
      contact_email: email,
      contact_phone: null,
      brokerage_name: null,
      licensed_agents: null,
      biggest_operational_challenge: null,
      source: "website_form" as const,
      source_url: "sorry#waitlist",
    };

    const supabase = await createServiceClient();
    const { error } = await supabase.from("warm_leads").insert(lead);

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Failed to save signup" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, redirect: redirectUrl },
      { headers: CORS_HEADERS }
    );
  }

  // blueprint form
  const name = body.name?.trim();
  const email = body.email?.trim();
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const lead = {
    contact_name: name,
    contact_email: email,
    contact_phone: body.phone?.trim() || null,
    brokerage_name: body.brokerage?.trim() || null,
    licensed_agents: mapAgentsToInt(body.agents),
    biggest_operational_challenge: body.challenge?.trim() || null,
    source: "lead_magnet" as const,
    source_url: "blueprint",
  };

  const supabase = await createServiceClient();
  const { error } = await supabase.from("warm_leads").insert(lead);

  if (error) {
    console.error("Blueprint insert error:", error);
    return NextResponse.json(
      { error: "Failed to save signup" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { ok: true, redirect: redirectUrl },
    { headers: CORS_HEADERS }
  );
}

function mapAgentsToInt(agents: string | undefined): number | null {
  if (!agents?.trim()) return null;
  const m: Record<string, number> = {
    "under-15": 10,
    "15-30": 22,
    "31-50": 40,
    "51-80": 65,
    "80+": 100,
  };
  return m[agents.trim()] ?? null;
}
