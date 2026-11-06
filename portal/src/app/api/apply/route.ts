import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Accepts form submissions from marketing/website/apply.html.
 * Stores data in Supabase applications table. Returns 200 on success (client redirects to thank you).
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
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400, headers: CORS_HEADERS });
  }

  const requestedRedirect =
    body._next || body._redirect || `${request.nextUrl.origin}/thankyou`;
  // Allow redirect only to our domains (prevent open redirect)
  const allowedOrigins = [
    "https://hestiaops.com",
    "https://www.hestiaops.com",
    "http://localhost",
    "http://127.0.0.1",
    request.nextUrl.origin,
  ];
  const redirectUrl = allowedOrigins.some((o) => requestedRedirect.startsWith(o))
    ? requestedRedirect
    : `${request.nextUrl.origin}/thankyou`;

  const application = {
    name: body.name?.trim() ?? "",
    email: body.email?.trim() ?? "",
    phone: body.phone?.trim() || null,
    brokerage: body.brokerage?.trim() || null,
    agents: body.agents?.trim() || null,
    budget: body.budget?.trim() || null,
    challenge: body.challenge?.trim() || null,
    crm: body.crm?.trim() || null,
    notes: body.notes?.trim() || null,
  };

  if (!application.name || !application.email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const supabase = await createServiceClient();
  const { error } = await supabase.from("applications").insert(application);

  if (error) {
    console.error("Application insert error:", error);
    return NextResponse.json(
      { error: "Failed to save application" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true, redirect: redirectUrl }, { headers: CORS_HEADERS });
}
