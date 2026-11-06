import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() !== "brokerage") {
    redirect("/team/dashboard");
  }

  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("agents")
    .select("*, teams(name)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data: agents } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Agent roster with license status and team assignments.
          </p>
        </div>
        <Button asChild>
          <Link href="/team/agents/new">
            <Plus className="mr-2 size-4" />
            Add Agent
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Agent Roster</CardTitle>
          <form className="flex max-w-sm items-center gap-2">
            <Input
              name="q"
              placeholder="Search by name or email..."
              defaultValue={q ?? ""}
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {(agents?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No agents yet. Add your first agent to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents!.map((agent) => {
                  const teamName =
                    (agent as { teams?: { name: string } }).teams?.name ?? "—";
                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <Link
                          href={`/team/agents/${agent.id}`}
                          className="font-medium hover:underline"
                        >
                          {agent.first_name} {agent.last_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {agent.email}
                      </TableCell>
                      <TableCell>{teamName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {agent.license_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[agent.status] ?? "secondary"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(agent.license_expiry)}
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
