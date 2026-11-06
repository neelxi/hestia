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

const sourceLabels: Record<string, string> = {
  lead_magnet: "Blueprint",
  website_form: "Waitlist",
  cold_email: "Cold Email",
  referral: "Referral",
};

const challengeLabels: Record<string, string> = {
  "tool-sprawl": "Too many disconnected tools",
  retention: "Retaining top-producing agents",
  bottleneck: "I'm the bottleneck for everything",
  pipeline: "No pipeline visibility",
  scaling: "Admin overhead doubles when we grow",
  other: "Something else",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { q, source } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("warm_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,brokerage_name.ilike.%${q}%`
    );
  }

  if (source) {
    query = query.eq("source", source);
  }

  const { data: leads } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Lead magnet and waitlist signups from the marketing site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Lead List</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex max-w-sm items-center gap-2">
              <Input
                name="q"
                placeholder="Search by name, email, or brokerage..."
                defaultValue={q ?? ""}
              />
              {source && (
                <input type="hidden" name="source" value={source} />
              )}
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Search
              </button>
            </form>
            <div className="flex gap-2">
              <Link
                href="/team/leads"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  !source
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All
              </Link>
              <Link
                href="/team/leads?source=lead_magnet"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  source === "lead_magnet"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Blueprint
              </Link>
              <Link
                href="/team/leads?source=website_form"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  source === "website_form"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Waitlist
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(leads?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No leads yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Brokerage</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads!.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link
                        href={`/team/leads/${lead.id}`}
                        className="font-medium hover:underline"
                      >
                        {lead.contact_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <a
                        href={`mailto:${lead.contact_email}`}
                        className="hover:underline"
                      >
                        {lead.contact_email}
                      </a>
                    </TableCell>
                    <TableCell>{lead.brokerage_name ?? "—"}</TableCell>
                    <TableCell>
                      {sourceLabels[lead.source] ?? lead.source}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {lead.biggest_operational_challenge
                        ? challengeLabels[lead.biggest_operational_challenge] ??
                          lead.biggest_operational_challenge
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(lead.created_at)}
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
