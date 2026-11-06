import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Button } from "@/components/ui/button";
import { DocForm } from "../../doc-form";
import { ArrowLeft } from "lucide-react";

export default async function EditDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/dashboard");

  if (profile.role !== "admin") {
    redirect("/team/docs");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("docs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doc) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/team/docs/${id}`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Doc</h1>
          <p className="text-muted-foreground">
            Update {doc.title}
          </p>
        </div>
      </div>
      <DocForm action="update" doc={doc} />
    </div>
  );
}
