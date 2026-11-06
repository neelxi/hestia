import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  error: "destructive",
};

export default async function IntegrationsPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("integration_providers")
    .select("*")
    .order("name");

  const { data: connected } = await supabase
    .from("integrations")
    .select("*, integration_providers(*)")
    .order("created_at", { ascending: false });

  const connectedList = (connected ?? []) as Array<{
    id: string;
    provider_id: string;
    status: string;
    last_synced_at: string | null;
    integration_providers: { name: string; description: string | null } | null;
  }>;

  const connectedProviderIds = new Set(
    connectedList.map((c) => c.provider_id)
  );
  const unconnected = (providers ?? []).filter(
    (p: { id: string }) => !connectedProviderIds.has(p.id)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external tools via API or webhooks. Add providers in the database, then configure your tool to send events here.
        </p>
      </div>

      {/* How to add an integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="size-5" />
            Adding a new integration
          </CardTitle>
          <CardDescription>
            No default providers are seeded. When you want to integrate a tool (e.g. Smartlead):
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-2 pl-4">
            <li>
              <strong>Add the provider</strong> — Insert a row into <code className="rounded bg-muted px-1">integration_providers</code> with <code className="rounded bg-muted px-1">name</code>, <code className="rounded bg-muted px-1">slug</code> (e.g. <code className="rounded bg-muted px-1">smartlead</code>), <code className="rounded bg-muted px-1">auth_type</code> (<code className="rounded bg-muted px-1">oauth</code> / <code className="rounded bg-muted px-1">api_key</code> / <code className="rounded bg-muted px-1">webhook_only</code>), and <code className="rounded bg-muted px-1">description</code>. Use Supabase SQL or dashboard.
            </li>
            <li>
              <strong>Connect it</strong> — Insert into <code className="rounded bg-muted px-1">integrations</code>: the provider&apos;s <code className="rounded bg-muted px-1">id</code>, and a <code className="rounded bg-muted px-1">webhook_secret</code> (if the tool sends webhooks). Set <code className="rounded bg-muted px-1">status</code> to <code className="rounded bg-muted px-1">active</code>.
            </li>
            <li>
              <strong>Webhooks</strong> — Have the tool POST to <code className="rounded bg-muted px-1">/api/webhooks/[slug]</code> with the secret in header <code className="rounded bg-muted px-1">x-webhook-secret</code>. Events are stored in <code className="rounded bg-muted px-1">integration_events</code> for processing.
            </li>
            <li>
              <strong>Processing</strong> — Add a script in <code className="rounded bg-muted px-1">execution/integrations/</code> or a directive to read from <code className="rounded bg-muted px-1">integration_events</code> and normalize data into clients, notes, etc.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Connected */}
      {connectedList.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Connected</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedList.map((ci) => (
              <Link key={ci.id} href={`/admin/integrations/${ci.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                      <Plug className="size-4" />
                    </div>
                    {ci.integration_providers?.name ?? "Unknown"}
                  </CardTitle>
                  <CardDescription>
                    {ci.integration_providers?.description ?? ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={statusVariant[ci.status] ?? "outline"}>{ci.status}</Badge>
                  {ci.last_synced_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last sync: {new Date(ci.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Available providers (from DB) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Providers in registry</h2>
        {(providers ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No providers yet. Add rows to <code className="rounded bg-muted px-1">integration_providers</code> when you integrate a tool.
          </p>
        ) : unconnected.length === 0 ? (
          <p className="text-sm text-muted-foreground">All registered providers are connected.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unconnected.map((p: { id: string; name: string; slug: string; description: string | null; auth_type: string }) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                      <Plug className="size-4" />
                    </div>
                    {p.name}
                  </CardTitle>
                  <CardDescription>{p.description ?? ""}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{p.auth_type}</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">Slug: {p.slug}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
