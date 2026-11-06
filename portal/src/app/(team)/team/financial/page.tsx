import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { DollarSign, Wallet } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function FinancialPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/dashboard");

  const supabase = await createClient();

  const [
    { data: clients },
    { data: projects },
  ] = await Promise.all([
    supabase.from("clients").select("annual_gci"),
    supabase.from("projects").select("budget"),
  ]);

  const totalRevenue = (clients ?? []).reduce((sum, c) => sum + (Number(c.annual_gci) || 0), 0);
  const totalBudget = (projects ?? []).reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial</h1>
        <p className="text-muted-foreground">
          Financial overview from client revenue and project budgets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (GCI)
            </CardTitle>
            <DollarSign className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sum of clients&apos; annual GCI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
            <Wallet className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sum of project budgets
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Revenue is aggregated from clients.annual_gci. Budget is aggregated from projects.budget.
            Invoicing and detailed financial reporting are on the roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
            Connect accounting integrations for detailed reports
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
