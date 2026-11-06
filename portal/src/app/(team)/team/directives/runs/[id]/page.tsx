import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const runStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  running: "default",
  completed: "secondary",
  failed: "destructive",
};

export default async function DirectiveRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: run, error } = await supabase
    .from("directive_runs")
    .select("*, directives(id, title)")
    .eq("id", id)
    .single();

  if (error || !run) notFound();

  const directive = run.directives as { id: string; title: string } | null;

  return (
    <div className="space-y-6">
      <Link
        href={directive ? `/team/directives/${directive.id}` : "/team/directives"}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {directive ? directive.title : "Directives"}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Run: {directive?.title ?? "Unknown"}
        </h1>
        <Badge variant={runStatusVariant[run.status] ?? "secondary"}>
          {run.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(run.started_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {run.completed_at ? formatDate(run.completed_at) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(run as { error_message?: string }).error_message && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {(run as { error_message: string }).error_message}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            {JSON.stringify(run.input ?? {}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {run.output != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
              {JSON.stringify(run.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
