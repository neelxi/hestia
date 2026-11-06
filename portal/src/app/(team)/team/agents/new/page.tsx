import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { createAgentAction } from "@/app/actions/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { ArrowLeft } from "lucide-react";

export default async function NewAgentPage() {
  await requireRole(["admin", "team"]);
  if (getPortalMode() !== "brokerage") redirect("/team/dashboard");

  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/team/agents" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Agents
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Agent</h1>
        <p className="text-muted-foreground">Add an agent to the brokerage roster.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Agent details</CardTitle></CardHeader>
        <CardContent>
          <form action={createAgentAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="first_name">First name</Label><Input id="first_name" name="first_name" required /></div>
              <div className="space-y-2"><Label htmlFor="last_name">Last name</Label><Input id="last_name" name="last_name" required /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="license_number">License number</Label><Input id="license_number" name="license_number" /></div>
              <div className="space-y-2"><Label htmlFor="license_expiry">License expiry</Label><Input id="license_expiry" name="license_expiry" type="date" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team_id">Team</Label>
                <select id="team_id" name="team_id" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">Unassigned</option>
                  {(teams ?? []).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue="active" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">
                  <option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="eo_policy_expiry">E&amp;O policy expiry</Label><Input id="eo_policy_expiry" name="eo_policy_expiry" type="date" /></div>
            <div className="flex gap-2">
              <FormSubmitButton pendingLabel="Adding…">Add Agent</FormSubmitButton>
              <Button variant="outline" asChild><Link href="/team/agents">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
