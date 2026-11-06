import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const runStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  running: "default",
  completed: "secondary",
  failed: "destructive",
};

export default async function DirectiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const [directiveRes, runsRes] = await Promise.all([
    supabase.from("directives").select("*").eq("id", id).single(),
    supabase
      .from("directive_runs")
      .select("*")
      .eq("directive_id", id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const { data: directive, error } = directiveRes;
  const recentRuns = runsRes.data ?? [];

  if (error || !directive) notFound();

  const triggerConditions = directive.trigger_conditions as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <Link
        href="/team/directives"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Directives
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{directive.title}</h1>
          <Badge variant="secondary">{directive.category}</Badge>
        {directive.is_automated ? (
          <Badge variant="default" className="gap-1">
            <Zap className="size-3" />
            Automated
          </Badge>
        ) : (
          <Badge variant="outline">Manual</Badge>
        )}
        </div>
        {profile.role === "admin" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/team/directives/${id}/edit`}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {triggerConditions && Object.keys(triggerConditions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trigger conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
              {JSON.stringify(triggerConditions, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
          <p className="text-sm text-muted-foreground">
            Updated {formatDate(directive.updated_at)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{directive.content || "*No content.*"}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No runs yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentRuns.map((run) => (
                <li key={run.id} className="flex items-center gap-3">
                  <Badge variant={runStatusVariant[run.status] ?? "secondary"}>
                    {run.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatRelative(run.started_at)}
                  </span>
                  <Link
                    href={`/team/directives/runs/${run.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View run
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
