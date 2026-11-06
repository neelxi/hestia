import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { createClientAction } from "@/app/actions/clients";
import { getClientLabel } from "@/lib/terminology";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default async function NewClientPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/agents");

  const label = getClientLabel(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/team/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {getClientLabel(false)}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add {label}</h1>
        <p className="text-muted-foreground">
          Create a new {label.toLowerCase()} record.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Acme Corp" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner / Contact Name</Label>
              <Input id="owner_name" name="owner_name" placeholder="John Smith" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="San Francisco, CA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_agents">Size (agents)</Label>
                <Input
                  id="size_agents"
                  name="size_agents"
                  type="number"
                  min={0}
                  placeholder="25"
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
                placeholder="3000000"
              />
            </div>
            <div className="flex gap-2">
              <FormSubmitButton pendingLabel={`Creating…`}>
                Create {label}
              </FormSubmitButton>
              <Button type="button" variant="outline" asChild>
                <Link href="/team/clients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
