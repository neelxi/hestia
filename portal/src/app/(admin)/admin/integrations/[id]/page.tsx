import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plug } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processed: "secondary",
  failed: "destructive",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*, integration_providers(*)")
    .eq("id", id)
    .single();

  if (error || !integration) notFound();

  const { data: events } = await supabase
    .from("integration_events")
    .select("*")
    .eq("integration_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const provider = integration.integration_providers as { name: string; description: string | null } | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/integrations">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Plug className="size-6" />
            {provider?.name ?? "Integration"}
          </h1>
          <p className="text-muted-foreground">
            {provider?.description ?? "Integration details and events"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Integration status and last sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={integration.status === "active" ? "default" : integration.status === "error" ? "destructive" : "secondary"}>
            {integration.status}
          </Badge>
          {integration.last_synced_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              Last synced: {formatDate(integration.last_synced_at)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Events</CardTitle>
          <CardDescription>
            Incoming webhook/API events for this integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(events?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No events yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events!.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium">{ev.event_type}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ev.processed_status] ?? "outline"}>
                        {ev.processed_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(ev.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {ev.error_message ?? "—"}
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
