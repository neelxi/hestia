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
import { ArrowLeft, CalendarDays, DollarSign } from "lucide-react";

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "team"]);
  if (getPortalMode() !== "brokerage") redirect("/team/dashboard");
  const { id } = await params;
  const supabase = await createClient();
  const [transactionRes, tasksRes, commissionsRes] = await Promise.all([
    supabase.from("transactions").select("*, listing_agent:agents!listing_agent_id(id, first_name, last_name), buyer_agent:agents!buyer_agent_id(id, first_name, last_name)").eq("id", id).single(),
    supabase.from("tasks").select("id, title, status, priority, due_date").eq("transaction_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("commissions").select("id, amount, status, split_percent, agents(id, first_name, last_name)").eq("transaction_id", id).order("created_at", { ascending: false }),
  ]);
  const transaction = transactionRes.data;
  if (!transaction) notFound();
  const tasks = tasksRes.data ?? [];
  const commissions = commissionsRes.data ?? [];
  const listingAgent = transaction.listing_agent as unknown as { id: string; first_name: string; last_name: string } | null;
  const buyerAgent = transaction.buyer_agent as unknown as { id: string; first_name: string; last_name: string } | null;

  return (
    <div className="space-y-6">
      <Link href="/team/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to Transactions</Link>
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight">{transaction.address}</h1><Badge>{transaction.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-muted-foreground">{transaction.type ?? "Transaction"}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">List price</CardTitle><DollarSign className="size-4 text-muted-foreground" /></CardHeader><CardContent className="text-2xl font-bold">{money(transaction.list_price)}</CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Closing date</CardTitle><CalendarDays className="size-4 text-muted-foreground" /></CardHeader><CardContent className="text-lg font-semibold">{transaction.closing_date ?? "Not scheduled"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Agents</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Listing: {listingAgent ? <Link className="font-medium hover:underline" href={`/team/agents/${listingAgent.id}`}>{listingAgent.first_name} {listingAgent.last_name}</Link> : "Unassigned"}</p><p>Buyer: {buyerAgent ? <Link className="font-medium hover:underline" href={`/team/agents/${buyerAgent.id}`}>{buyerAgent.first_name} {buyerAgent.last_name}</Link> : "Unassigned"}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Closing tasks</CardTitle></CardHeader><CardContent>{tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks for this transaction.</p> : <Table><TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Due</TableHead></TableRow></TableHeader><TableBody>{tasks.map((task) => <TableRow key={task.id}><TableCell><Link className="font-medium hover:underline" href={`/team/tasks/${task.id}`}>{task.title}</Link></TableCell><TableCell><Badge variant="outline">{task.status.replaceAll("_", " ")}</Badge></TableCell><TableCell>{task.due_date ?? "—"}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Commissions</CardTitle></CardHeader><CardContent>{commissions.length === 0 ? <p className="text-sm text-muted-foreground">No commissions attached.</p> : <Table><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{commissions.map((commission) => { const agent = commission.agents as unknown as { first_name: string; last_name: string } | null; return <TableRow key={commission.id}><TableCell>{agent ? `${agent.first_name} ${agent.last_name}` : "—"}</TableCell><TableCell>{money(commission.amount)}</TableCell><TableCell><Badge variant="outline">{commission.status}</Badge></TableCell></TableRow>; })}</TableBody></Table>}</CardContent></Card>
      </div>
    </div>
  );
}
