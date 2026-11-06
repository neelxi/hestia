import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "team"]);
  if (getPortalMode() !== "brokerage") redirect("/team/dashboard");
  const { id } = await params;
  const supabase = await createClient();
  const [agentRes, transactionRes, commissionRes] = await Promise.all([
    supabase.from("agents").select("*, teams(name)").eq("id", id).single(),
    supabase.from("transactions").select("id, address, status, closing_date, list_price").or(`listing_agent_id.eq.${id},buyer_agent_id.eq.${id}`).order("closing_date", { ascending: true, nullsFirst: false }),
    supabase.from("commissions").select("id, amount, status, transaction_id").eq("agent_id", id).order("created_at", { ascending: false }),
  ]);
  const agent = agentRes.data;
  if (!agent) notFound();
  const transactions = transactionRes.data ?? [];
  const commissions = commissionRes.data ?? [];

  return (
    <div className="space-y-6">
      <Link href="/team/agents" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to Agents</Link>
      <div>
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold tracking-tight">{agent.first_name} {agent.last_name}</h1><Badge>{agent.status}</Badge></div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Mail className="size-4" />{agent.email}</span>
          {agent.phone && <span className="flex items-center gap-1"><Phone className="size-4" />{agent.phone}</span>}
          <span>License: {agent.license_number ?? "Not recorded"}</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Transactions</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{transactions.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pending commission</CardTitle></CardHeader><CardContent className="text-3xl font-bold">${commissions.filter((item) => item.status !== "paid").reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Team</CardTitle></CardHeader><CardContent className="font-medium">{(agent.teams as unknown as { name?: string } | null)?.name ?? "Unassigned"}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Transaction pipeline</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? <p className="text-sm text-muted-foreground">No transactions assigned.</p> : (
            <Table><TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Status</TableHead><TableHead>Closing</TableHead></TableRow></TableHeader><TableBody>
              {transactions.map((transaction) => <TableRow key={transaction.id}><TableCell><Link className="font-medium hover:underline" href={`/team/transactions/${transaction.id}`}>{transaction.address}</Link></TableCell><TableCell><Badge variant="outline">{transaction.status.replaceAll("_", " ")}</Badge></TableCell><TableCell>{transaction.closing_date ?? "—"}</TableCell></TableRow>)}
            </TableBody></Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
