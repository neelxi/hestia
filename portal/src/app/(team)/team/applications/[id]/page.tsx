import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ConvertApplicationButtons } from "./convert-application-buttons";

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

const challengeLabels: Record<string, string> = {
  "tool-sprawl": "Too many disconnected tools",
  retention: "Retaining top-producing agents",
  bottleneck: "I'm the bottleneck for everything",
  pipeline: "No pipeline visibility or single source of truth",
  scaling: "Admin overhead doubles when we grow",
  other: "Something else",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !app) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/team/applications"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Applications
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
          <p className="text-muted-foreground">
            Submitted {formatDate(app.created_at)}
          </p>
        </div>
        <ConvertApplicationButtons applicationId={app.id} />
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
                href={`mailto:${app.email}`}
                className="font-medium hover:underline"
              >
                {app.email}
              </a>
            </div>
            {app.phone && (
              <div>
                <p className="text-muted-foreground">Phone</p>
                <a
                  href={`tel:${app.phone}`}
                  className="font-medium hover:underline"
                >
                  {app.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brokerage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{app.brokerage ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Agent count</p>
              <p className="font-medium">{app.agents ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Budget works</p>
              <p className="font-medium capitalize">{app.budget ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Biggest challenge</p>
              <p className="font-medium">
                {app.challenge
                  ? challengeLabels[app.challenge] ?? app.challenge
                  : "—"}
              </p>
            </div>
            {app.crm && (
              <div>
                <p className="text-muted-foreground">Current CRM</p>
                <p className="font-medium">{app.crm}</p>
              </div>
            )}
            {app.notes && (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium whitespace-pre-wrap">{app.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
