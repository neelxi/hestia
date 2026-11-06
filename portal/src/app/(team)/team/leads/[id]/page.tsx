import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { LeadStatusForm } from "./lead-status-form";
import { LeadEditForm } from "./lead-edit-form";
import { ConvertLeadButton } from "./convert-lead-button";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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
  pipeline: "No pipeline visibility or single source of truth",
  scaling: "Admin overhead doubles when we grow",
  other: "Something else",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const [leadRes, profilesRes] = await Promise.all([
    supabase.from("warm_leads").select("*").eq("id", id).single(),
    supabase.from("profiles").select("id, display_name").order("display_name"),
  ]);

  const { data: lead, error } = leadRes;
  const profiles = profilesRes.data ?? [];

  if (error || !lead) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/team/leads"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lead.contact_name}
          </h1>
          <p className="text-muted-foreground">
            {sourceLabels[lead.source] ?? lead.source} · Submitted{" "}
            {formatDate(lead.created_at)}
          </p>
        </div>
        {!lead.converted_to_client_id && (
          <ConvertLeadButton leadId={id} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <a
                href={`mailto:${lead.contact_email}`}
                className="font-medium hover:underline"
              >
                {lead.contact_email}
              </a>
            </div>
            {lead.contact_phone && (
              <div>
                <p className="text-muted-foreground">Phone</p>
                <a
                  href={`tel:${lead.contact_phone}`}
                  className="font-medium hover:underline"
                >
                  {lead.contact_phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">
                {sourceLabels[lead.source] ?? lead.source}
              </p>
            </div>
            {lead.source_url && (
              <div>
                <p className="text-muted-foreground">Source URL</p>
                <p className="font-medium">{lead.source_url}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Status</p>
              <LeadStatusForm leadId={id} currentStatus={lead.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lead.brokerage_name && (
              <div>
                <p className="text-muted-foreground">Brokerage</p>
                <p className="font-medium">{lead.brokerage_name}</p>
              </div>
            )}
            {lead.licensed_agents != null && (
              <div>
                <p className="text-muted-foreground">Licensed agents</p>
                <p className="font-medium">{lead.licensed_agents}</p>
              </div>
            )}
            {lead.biggest_operational_challenge && (
              <div>
                <p className="text-muted-foreground">Biggest challenge</p>
                <p className="font-medium">
                  {challengeLabels[lead.biggest_operational_challenge] ??
                    lead.biggest_operational_challenge}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadEditForm
              leadId={id}
              currentStatus={lead.status}
              currentAssigneeId={lead.assignee_id}
              currentNotes={lead.notes}
              profiles={profiles}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
