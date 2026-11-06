import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  active: "default",
  pending_close: "secondary",
  closed: "secondary",
  archived: "outline",
  cancelled: "destructive",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() !== "brokerage") {
    redirect("/team/dashboard");
  }

  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(`
      *,
      listing_agent:agents!listing_agent_id(first_name, last_name),
      buyer_agent:agents!buyer_agent_id(first_name, last_name)
    `)
    .order("closing_date", { ascending: true, nullsFirst: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: transactions } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Pipeline of active and closed deals across all agents.
          </p>
        </div>
        <Button asChild>
          <Link href="/team/transactions/new">
            <Plus className="mr-2 size-4" />
            Add Transaction
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Transaction Pipeline</CardTitle>
          <div className="flex gap-2">
            <Link
              href="/team/transactions"
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                !status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </Link>
            <Link
              href="/team/transactions?status=active"
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                status === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Active
            </Link>
            <Link
              href="/team/transactions?status=pending_close"
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                status === "pending_close"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Pending Close
            </Link>
            <Link
              href="/team/transactions?status=closed"
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                status === "closed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Closed
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(transactions?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>List Price</TableHead>
                  <TableHead>Listing Agent</TableHead>
                  <TableHead>Buyer Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions!.map((tx) => {
                  const listingAgent = (tx as { listing_agent?: { first_name: string; last_name: string } }).listing_agent;
                  const buyerAgent = (tx as { buyer_agent?: { first_name: string; last_name: string } }).buyer_agent;
                  const listingName = listingAgent
                    ? `${listingAgent.first_name} ${listingAgent.last_name}`
                    : "—";
                  const buyerName = buyerAgent
                    ? `${buyerAgent.first_name} ${buyerAgent.last_name}`
                    : "—";
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/team/transactions/${tx.id}`}
                          className="hover:underline"
                        >
                          {tx.address}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(tx.list_price)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {listingName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {buyerName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[tx.status] ?? "secondary"}
                        >
                          {tx.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(tx.closing_date)}
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
