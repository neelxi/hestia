import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { updateDirectiveAction } from "@/app/actions/directives";

export default async function EditDirectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  try {
    await requireRole(["admin"]);
  } catch {
    redirect("/team/directives");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: directive, error } = await supabase
    .from("directives")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !directive) notFound();

  const triggerConditionsStr =
    directive.trigger_conditions != null
      ? JSON.stringify(directive.trigger_conditions, null, 2)
      : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/team/directives/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {directive.title}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Directive
        </h1>
        <p className="text-muted-foreground">
          Update directive details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={(fd) => updateDirectiveAction(id, fd)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={directive.title}
                placeholder="e.g. Onboard new client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                defaultValue={directive.category}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="operations">Operations</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="software">Software</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <textarea
                id="content"
                name="content"
                rows={12}
                defaultValue={directive.content}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs font-mono"
                placeholder="# Steps&#10;1. First step..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_automated"
                name="is_automated"
                value="true"
                defaultChecked={directive.is_automated}
                className="rounded border"
              />
              <Label htmlFor="is_automated">Automated</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger_conditions">
                Trigger conditions (JSON, optional)
              </Label>
              <textarea
                id="trigger_conditions"
                name="trigger_conditions"
                rows={4}
                defaultValue={triggerConditionsStr}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs font-mono"
                placeholder='{"event": "client_created"}'
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/team/directives/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
