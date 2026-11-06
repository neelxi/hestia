import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { getPortalMode } from "@/lib/portal-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { updateProjectAction } from "@/app/actions/projects";
import { getProjectLabel, getClientLabel } from "@/lib/terminology";

const PROJECT_STATUSES = [
  "discovery",
  "implementation",
  "active",
  "on_hold",
  "completed",
  "archived",
];

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/transactions");

  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  const label = getProjectLabel(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/team/projects/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {project.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit {label}</h1>
        <p className="text-muted-foreground">
          Update {project.name}&apos;s details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={(fd) => updateProjectAction(id, fd)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">{getClientLabel(true)}</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={project.client_id ?? ""}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="">— Select {getClientLabel(true).toLowerCase()} —</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={project.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={project.description ?? ""}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={project.status}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={project.start_date ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={project.end_date ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min={0}
                defaultValue={project.budget ?? ""}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/team/projects/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
