import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { readFile } from "fs/promises";
import path from "path";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateConfig {
  id: string;
  name: string;
  extends?: string;
  terminology: Record<string, Record<string, string>>;
  workflows: Record<string, string[]>;
  compliance: { enabled: boolean; [k: string]: unknown };
  ownerDashboard: { modules: string[] };
  defaultDirectives: string[];
  recommendedIntegrations: string[];
}

async function loadTemplate(templateId: string): Promise<TemplateConfig | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "..",
      "templates",
      `${templateId}.json`
    );
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as TemplateConfig;
  } catch {
    return null;
  }
}

export default async function TemplatesPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspace")
    .select("template_id")
    .limit(1)
    .single();

  const templateId = workspace?.template_id ?? "base";
  const template = await loadTemplate(templateId);

  if (!template) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Template Config</h1>
        <p className="text-muted-foreground">
          Template <code>{templateId}</code> not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Template Config</h1>
        <p className="text-muted-foreground">
          Active template:{" "}
          <span className="font-medium text-foreground">{template.name}</span>
          {template.extends && (
            <span className="ml-1 text-xs">(extends {template.extends})</span>
          )}
        </p>
      </div>

      {/* Terminology */}
      <Card>
        <CardHeader>
          <CardTitle>Terminology</CardTitle>
          <CardDescription>
            How entities and roles are labeled in your portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(template.terminology).map(([group, entries]) => (
              <div key={group} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                <ul className="space-y-0.5 text-sm">
                  {Object.entries(entries).map(([key, value]) => (
                    <li key={key}>
                      <span className="text-muted-foreground">{key}:</span>{" "}
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>Status pipelines for projects and tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(template.workflows).map(([pipeline, statuses]) => (
              <div key={pipeline}>
                <p className="mb-1 text-sm font-medium">{pipeline}</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={template.compliance.enabled ? "default" : "outline"}>
            {template.compliance.enabled ? "Enabled" : "Disabled"}
          </Badge>
          {Object.keys(template.compliance).length > 1 && (
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(template.compliance, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Recommended Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {template.recommendedIntegrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recommended integrations for this template.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {template.recommendedIntegrations.map((slug) => (
                <Badge key={slug} variant="secondary">
                  {slug}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Directives */}
      <Card>
        <CardHeader>
          <CardTitle>Default Directives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {template.defaultDirectives.map((d) => (
              <Badge key={d} variant="outline">
                {d}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
