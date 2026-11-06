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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  prospect: "outline",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/agents");

  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships.
          </p>
        </div>
        <Button asChild>
          <Link href="/team/clients/new">
            <Plus className="mr-2 size-4" />
            Add Client
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Client List</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex max-w-sm items-center gap-2">
              <Input
                name="q"
                placeholder="Search clients..."
                defaultValue={q ?? ""}
              />
              {status && <input type="hidden" name="status" value={status} />}
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            <div className="flex gap-1">
              <Button variant={!status || status === "all" ? "default" : "outline"} size="sm" asChild>
                <Link href={q ? `/team/clients?q=${q}` : "/team/clients"}>All</Link>
              </Button>
              <Button variant={status === "active" ? "default" : "outline"} size="sm" asChild>
                <Link href={q ? `/team/clients?status=active&q=${q}` : "/team/clients?status=active"}>Active</Link>
              </Button>
              <Button variant={status === "inactive" ? "default" : "outline"} size="sm" asChild>
                <Link href={q ? `/team/clients?status=inactive&q=${q}` : "/team/clients?status=inactive"}>Inactive</Link>
              </Button>
              <Button variant={status === "prospect" ? "default" : "outline"} size="sm" asChild>
                <Link href={q ? `/team/clients?status=prospect&q=${q}` : "/team/clients?status=prospect"}>Prospect</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(clients?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No clients found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients!.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/team/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[client.status] ?? "secondary"}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(client.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
