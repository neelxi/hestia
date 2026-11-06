import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "team"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { directive_id?: string; input?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { directive_id, input } = body;

  if (!directive_id) {
    return NextResponse.json(
      { error: "directive_id is required" },
      { status: 400 }
    );
  }

  const { data: directive, error: directiveErr } = await supabase
    .from("directives")
    .select("id, title")
    .eq("id", directive_id)
    .single();

  if (directiveErr || !directive) {
    return NextResponse.json(
      { error: "Directive not found" },
      { status: 404 }
    );
  }

  const service = await createServiceClient();

  const { data: run, error: runErr } = await service
    .from("directive_runs")
    .insert({
      directive_id: directive.id,
      status: "running",
      input: input ?? {},
    })
    .select("id, status, started_at")
    .single();

  if (runErr) {
    return NextResponse.json(
      { error: "Failed to create run", details: runErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { run_id: run.id, status: run.status, started_at: run.started_at },
    { status: 201 }
  );
}
