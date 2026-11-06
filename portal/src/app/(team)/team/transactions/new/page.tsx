import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { createTransactionAction } from "@/app/actions/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { ArrowLeft } from "lucide-react";

export default async function NewTransactionPage() {
  await requireRole(["admin", "team"]);
  if (getPortalMode() !== "brokerage") redirect("/team/dashboard");
  const supabase = await createClient();
  const { data: agents } = await supabase.from("agents").select("id, first_name, last_name").eq("status", "active").order("last_name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/team/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to Transactions</Link>
      <div><h1 className="text-2xl font-bold tracking-tight">Add Transaction</h1><p className="text-muted-foreground">Add a deal to the brokerage pipeline.</p></div>
      <Card><CardHeader><CardTitle>Transaction details</CardTitle></CardHeader><CardContent>
        <form action={createTransactionAction} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="address">Property address</Label><Input id="address" name="address" required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="list_price">List price</Label><Input id="list_price" name="list_price" type="number" min="0" step="1" /></div><div className="space-y-2"><Label htmlFor="type">Type</Label><select id="type" name="type" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="listing">Listing</option><option value="buyer">Buyer</option><option value="dual">Dual agency</option></select></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="listing_agent_id">Listing agent</Label><select id="listing_agent_id" name="listing_agent_id" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="">Unassigned</option>{(agents ?? []).map((agent) => <option key={agent.id} value={agent.id}>{agent.first_name} {agent.last_name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="buyer_agent_id">Buyer agent</Label><select id="buyer_agent_id" name="buyer_agent_id" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="">Unassigned</option>{(agents ?? []).map((agent) => <option key={agent.id} value={agent.id}>{agent.first_name} {agent.last_name}</option>)}</select></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" defaultValue="pending" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="pending">Pending</option><option value="active">Active</option><option value="pending_close">Pending close</option><option value="closed">Closed</option></select></div><div className="space-y-2"><Label htmlFor="closing_date">Closing date</Label><Input id="closing_date" name="closing_date" type="date" /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="contingency_date">Contingency date</Label><Input id="contingency_date" name="contingency_date" type="date" /></div><div className="space-y-2"><Label htmlFor="inspection_deadline">Inspection deadline</Label><Input id="inspection_deadline" name="inspection_deadline" type="datetime-local" /></div></div>
          <div className="flex gap-2"><FormSubmitButton pendingLabel="Adding…">Add Transaction</FormSubmitButton><Button variant="outline" asChild><Link href="/team/transactions">Cancel</Link></Button></div>
        </form>
      </CardContent></Card>
    </div>
  );
}
