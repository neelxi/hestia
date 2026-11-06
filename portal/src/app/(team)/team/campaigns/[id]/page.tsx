import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function formatPct(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const [campaignRes, recipientsRes] = await Promise.all([
    supabase
      .from("cold_email_campaigns")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("cold_campaign_recipients")
      .select("*, warm_leads(id, contact_name, contact_email)")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const { data: campaign, error } = campaignRes;
  const recipients = recipientsRes.data ?? [];

  if (error || !campaign) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/team/campaigns"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {campaign.campaign_name}
        </h1>
        {campaign.campaign_link && (
          <a
            href={campaign.campaign_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            {campaign.campaign_link}
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.sent_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.opened_count}</p>
            <p className="text-sm text-muted-foreground">
              {formatPct(campaign.open_rate_pct)} open rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.response_count}</p>
            <p className="text-sm text-muted-foreground">
              {formatPct(campaign.response_rate_pct)} response rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last synced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {formatDate(campaign.last_synced_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <p className="text-sm text-muted-foreground">
            {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recipients yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => {
                  const warmLead =
                    r.warm_leads &&
                    typeof r.warm_leads === "object" &&
                    !Array.isArray(r.warm_leads)
                      ? (r.warm_leads as { id: string; contact_name: string; contact_email: string })
                      : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.email}</TableCell>
                      <TableCell>{r.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.opened_at ? formatDate(r.opened_at) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.replied_at ? formatDate(r.replied_at) : "—"}
                      </TableCell>
                      <TableCell>
                        {warmLead ? (
                          <Link
                            href={`/team/leads/${warmLead.id}`}
                            className="text-primary hover:underline"
                          >
                            {warmLead.contact_name}
                          </Link>
                        ) : (
                          "—"
                        )}
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
