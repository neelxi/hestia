import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  team: "secondary",
  client: "outline",
};

export default async function UsersPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const userIds = (profiles ?? []).map((p) => p.user_id);

  // Fetch auth emails via a service-role call (profiles don't store email)
  // Requires SUPABASE_SERVICE_ROLE_KEY in env — if missing, emails show as "—"
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const service = await createServiceClient();
      const { data } = await service.auth.admin.listUsers();
      if (data?.users) {
        for (const u of data.users) {
          emailMap[u.id] = u.email ?? "";
        }
      }
    } catch (err) {
      console.error("Users page: failed to fetch auth emails:", err);
      // Page still renders; emails show as "—"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage team members and their roles.
          </p>
        </div>
        <Button>Invite User</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {profiles?.length ?? 0} user{(profiles?.length ?? 0) !== 1 && "s"}{" "}
            in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(profiles ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.display_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emailMap[p.user_id] || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[p.role] ?? "outline"}>
                      {p.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!profiles || profiles.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
