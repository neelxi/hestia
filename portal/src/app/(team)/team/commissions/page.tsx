import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  approved: "secondary",
  paid: "default",
  disputed: "destructive",
};

export default async function CommissionsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() !== "brokerage") {
    redirect("/team/dashboard");
  }

  const supabase = await createClient();

  const [commissionsRes, pendingRes, paidRes] = await Promise.all([
    supabase
      .from("commissions")
      .select("*, agents(first_name, last_name, email), transactions(address)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("commissions")
      .select("id, amount", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("commissions")
      .select("id, amount", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("disbursement_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const commissions = commissionsRes.data ?? [];
  const pendingCount = pendingRes.count ?? 0;
  const paidThisMonth = paidRes.count ?? 0;

  // Sum pending amounts
  const { data: pendingRows } = await supabase
    .from("commissions")
    .select("amount")
    .eq("status", "pending");
  const pendingTotal = (pendingRows ?? []).reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
        <p className="text-muted-foreground">
          Commission queue, disbursements, and reconciliation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(pendingTotal)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total in queue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid This Month
            </CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{paidThisMonth}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Disbursements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disputed
            </CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(commissions.filter((c) => c.status === "disputed").length)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Queue</CardTitle>
          <CardDescription>
            Recent commissions. Process pending items from transaction closings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commission records yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Split</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Disbursement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => {
                  const agent = (c as { agents?: { first_name: string; last_name: string } }).agents;
                  const tx = (c as { transactions?: { address: string } }).transactions;
                  const agentName = agent
                    ? `${agent.first_name} ${agent.last_name}`
                    : "—";
                  const address = tx?.address ?? "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{agentName}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[180px]">
                        {address}
                      </TableCell>
                      <TableCell>{formatCurrency(c.amount)}</TableCell>
                      <TableCell className="text-sm">
                        {c.split_percent != null
                          ? `${c.split_percent}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[c.status] ?? "secondary"}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(c.disbursement_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
