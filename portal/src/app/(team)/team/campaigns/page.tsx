import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  });
}

function formatPct(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export default async function CampaignsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("cold_email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Cold email campaigns and performance metrics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No campaigns yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/team/campaigns/${c.id}`}
                        className="hover:underline"
                      >
                        {c.campaign_name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.sent_count}</TableCell>
                    <TableCell>{c.opened_count}</TableCell>
                    <TableCell>{formatPct(c.open_rate_pct)}</TableCell>
                    <TableCell>{c.response_count}</TableCell>
                    <TableCell>{formatPct(c.response_rate_pct)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.campaign_started_at
                        ? formatDate(c.campaign_started_at)
                        : "—"}
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
