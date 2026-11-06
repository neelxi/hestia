import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { getProjectLabel, getClientLabel } from "@/lib/terminology";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
  cancelled: "destructive",
};

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/transactions");

  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getProjectLabel(false)}</h1>
          <p className="text-muted-foreground">
            All {getProjectLabel(false).toLowerCase()} across your {getClientLabel(false).toLowerCase()}.
          </p>
        </div>
        <Button asChild>
          <Link href="/team/projects/new">
            <Plus className="mr-2 size-4" />
            Add {getProjectLabel(true)}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Project List</CardTitle>
        </CardHeader>
        <CardContent>
          {(projects?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects!.map((project) => {
                  const clientName =
                    (project as Record<string, unknown>).clients &&
                    typeof (project as Record<string, unknown>).clients === "object"
                      ? ((project as Record<string, unknown>).clients as { name: string })?.name
                      : "—";

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/team/projects/${project.id}`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {project.client_id ? (
                          <Link
                            href={`/team/clients/${project.client_id}`}
                            className="text-muted-foreground hover:underline"
                          >
                            {clientName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[project.status] ?? "secondary"
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.start_date
                          ? formatDate(project.start_date)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.end_date
                          ? formatDate(project.end_date)
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
