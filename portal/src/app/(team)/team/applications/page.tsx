import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const challengeLabels: Record<string, string> = {
  "tool-sprawl": "Too many disconnected tools",
  retention: "Retaining top-producing agents",
  bottleneck: "I'm the bottleneck for everything",
  pipeline: "No pipeline visibility",
  scaling: "Admin overhead doubles when we grow",
  other: "Something else",
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,brokerage.ilike.%${q}%`
    );
  }

  const { data: applications } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Lead form submissions from the marketing site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Application List</CardTitle>
          <form className="flex max-w-sm items-center gap-2">
            <Input
              name="q"
              placeholder="Search by name, email, or brokerage..."
              defaultValue={q ?? ""}
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </CardHeader>
        <CardContent>
          {(applications?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No applications yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Brokerage</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications!.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/team/applications/${app.id}`}
                        className="font-medium hover:underline"
                      >
                        {app.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <a
                        href={`mailto:${app.email}`}
                        className="hover:underline"
                      >
                        {app.email}
                      </a>
                    </TableCell>
                    <TableCell>{app.brokerage ?? "—"}</TableCell>
                    <TableCell>{app.agents ?? "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {app.challenge
                        ? challengeLabels[app.challenge] ?? app.challenge
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(app.created_at)}
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
