import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function saveSettings(formData: FormData) {
  "use server";

  const supabase = await createClient();
  await requireRole(["admin"]);

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const templateId = formData.get("template_id") as string;

  const { data: workspace } = await supabase
    .from("workspace")
    .select("id")
    .limit(1)
    .single();

  if (!workspace) throw new Error("Workspace not found. Run setup script first.");

  const { error } = await supabase
    .from("workspace")
    .update({ name, type, template_id: templateId })
    .eq("id", workspace.id);

  if (error) throw new Error(error.message);

  redirect("/admin/settings");
}

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspace")
    .select("*")
    .limit(1)
    .single();

  if (!workspace) {
    return <p className="text-muted-foreground">Workspace not found. Run the setup script first.</p>;
  }

  const templates = ["base", "agency", "professional-services", "brokerage", "hestia"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace profile and configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your workspace name, type, and template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={workspace.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Workspace Type</Label>
              <Input
                id="type"
                name="type"
                defaultValue={workspace.type}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_id">Template</Label>
              <select
                id="template_id"
                name="template_id"
                defaultValue={workspace.template_id}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                {templates.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            Raw workspace record from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(workspace, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
