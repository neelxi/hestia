import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { updateClientAction } from "@/app/actions/clients";
import { getClientLabel } from "@/lib/terminology";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/agents");

  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const label = getClientLabel(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/team/clients/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {client.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit {label}</h1>
        <p className="text-muted-foreground">
          Update {client.name}&apos;s details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={(fd) => updateClientAction(id, fd)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={client.name}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={client.email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={client.phone ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={client.status}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner / Contact Name</Label>
              <Input
                id="owner_name"
                name="owner_name"
                defaultValue={typeof (client as Record<string, unknown>).owner_name === "string" ? (client as Record<string, unknown>).owner_name as string : ""}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={typeof (client as Record<string, unknown>).location === "string" ? (client as Record<string, unknown>).location as string : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_agents">Size (agents)</Label>
                <Input
                  id="size_agents"
                  name="size_agents"
                  type="number"
                  min={0}
                  defaultValue={(client as Record<string, unknown>).size_agents != null ? String((client as Record<string, unknown>).size_agents) : ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_gci">Annual GCI</Label>
              <Input
                id="annual_gci"
                name="annual_gci"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(client as Record<string, unknown>).annual_gci != null ? String((client as Record<string, unknown>).annual_gci) : ""}
              />
            </div>
            <div className="flex gap-2">
              <FormSubmitButton>Save Changes</FormSubmitButton>
              <Button type="button" variant="outline" asChild>
                <Link href={`/team/clients/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
