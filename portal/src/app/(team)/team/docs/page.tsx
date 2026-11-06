import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DocsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/dashboard");

  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("docs")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Docs</h1>
          <p className="text-muted-foreground">
            Internal documentation and knowledge base.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/team/docs/new">
              <Plus className="mr-2 size-4" />
              New Doc
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Docs List</CardTitle>
        </CardHeader>
        <CardContent>
          {(docs?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No docs yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs!.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/team/docs/${doc.id}`}
                        className="hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.updated_at)}
                    </TableCell>
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
