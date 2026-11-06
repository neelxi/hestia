import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
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
import { DollarSign, Home, ListChecks } from "lucide-react";

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default async function AgentDashboardPage() {
  const profile = await requireRole(["agent"]);
  if (!profile.agent_id) redirect("/login");

  const supabase = await createClient();
  const [agentRes, transactionRes, commissionRes] = await Promise.all([
    supabase.from("agents").select("*").eq("id", profile.agent_id).single(),
    supabase
      .from("transactions")
      .select("*")
      .or(`listing_agent_id.eq.${profile.agent_id},buyer_agent_id.eq.${profile.agent_id}`)
      .order("closing_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("commissions")
      .select("*")
      .eq("agent_id", profile.agent_id)
      .order("created_at", { ascending: false }),
  ]);

  const agent = agentRes.data;
  const transactions = transactionRes.data ?? [];
  const commissions = commissionRes.data ?? [];
  const pendingCommission = commissions
    .filter((item) => item.status !== "paid")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{agent ? `, ${agent.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Your transactions, deadlines, and commission pipeline in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active transactions</CardTitle>
            <Home className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {transactions.filter((item) => item.status !== "closed").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending commission</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {formatCurrency(pendingCommission)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">License status</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={agent?.status === "active" ? "default" : "secondary"}>
              {agent?.status ?? "unknown"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closing</TableHead>
                  <TableHead>List price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{transaction.closing_date ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(transaction.list_price)}</TableCell>
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
