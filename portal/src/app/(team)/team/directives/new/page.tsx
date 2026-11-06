import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { createDirectiveAction } from "@/app/actions/directives";

export default async function NewDirectivePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  try {
    await requireRole(["admin"]);
  } catch {
    redirect("/team/directives");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/team/directives"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Directives
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Directive</h1>
        <p className="text-muted-foreground">
          Create a new SOP or automation directive.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDirectiveAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Onboard new client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
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
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs font-mono"
                placeholder='{"event": "client_created"}'
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create directive</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/team/directives">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
