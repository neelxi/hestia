import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { BookOpen, Zap } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function DirectivesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const [directivesRes, runsRes] = await Promise.all([
    supabase
      .from("directives")
      .select("*")
      .order("category", { ascending: true }),
    supabase
      .from("directive_runs")
      .select("*, directives(title)")
      .order("started_at", { ascending: false })
      .limit(15),
  ]);

  const directives = directivesRes.data ?? [];
  const recentRuns = runsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directives</h1>
          <p className="text-muted-foreground">
            Your SOP library — standard operating procedures and automations.
          </p>
        </div>
        {profile.role === "admin" && (
          <Button asChild>
            <Link href="/team/directives/new">New directive</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            All Directives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {directives.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No directives yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Automated</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directives.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/team/directives/${d.id}`}
                        className="hover:underline"
                      >
                        {d.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {d.is_automated ? (
                        <Badge variant="default" className="gap-1">
                          <Zap className="size-3" />
                          Auto
                        </Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(d.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            Recent Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No directive runs yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Directive</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => {
                  const directiveTitle =
                    run.directives &&
                    typeof run.directives === "object" &&
                    "title" in (run.directives as Record<string, unknown>)
                      ? (run.directives as { title: string }).title
                      : "—";

                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/team/directives/runs/${run.id}`}
                          className="hover:underline"
                        >
                          {directiveTitle}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            runStatusVariant[run.status] ?? "secondary"
                          }
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelative(run.started_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {run.completed_at
                          ? formatRelative(run.completed_at)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
