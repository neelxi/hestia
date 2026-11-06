import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteDocButton } from "./delete-doc-button";
import { DocMarkdown } from "./doc-markdown";
import { ArrowLeft, Pencil } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/dashboard");

  const { id } = await params;
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("docs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doc) notFound();

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team/docs">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{doc.category}</Badge>
            <span className="text-sm text-muted-foreground">
              Updated {formatDate(doc.updated_at)}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/team/docs/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
            <DeleteDocButton docId={id} docTitle={doc.title} />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <DocMarkdown content={doc.content} />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
