import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "team"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: run, error } = await supabase
    .from("directive_runs")
    .select("id, directive_id, status, input, output, started_at, completed_at, directives(title)")
    .eq("id", id)
    .single();

  if (error || !run) {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: run.id,
    directive_id: run.directive_id,
    directive_title: (run as Record<string, unknown>).directives
      ? ((run as Record<string, unknown>).directives as { title: string }).title
      : null,
    status: run.status,
    input: run.input,
    output: run.output,
    started_at: run.started_at,
    completed_at: run.completed_at,
  });
}
