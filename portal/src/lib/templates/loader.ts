import { readFile } from "fs/promises";
import { join } from "path";

export interface TemplateTerminology {
  entities: Record<string, string>;
  roles: Record<string, string>;
  clientPortal: Record<string, string>;
  metrics: Record<string, string>;
}

export interface TemplateWorkflows {
  projectStatuses: string[];
  taskStatuses: string[];
}

export interface TemplateCompliance {
  enabled: boolean;
  auditTrail?: boolean;
  documentRetentionDays?: number;
}

export interface Template {
  id: string;
  name: string;
  extends?: string;
  terminology: TemplateTerminology;
  workflows: TemplateWorkflows;
  compliance: TemplateCompliance;
  ownerDashboard: { modules: string[] };
  defaultDirectives: string[];
  recommendedIntegrations: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(override)) {
    const baseVal = result[key];
    const overrideVal = override[key];

    if (isRecord(baseVal) && isRecord(overrideVal)) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }

  return result as T;
}

const TEMPLATES_DIR = join(process.cwd(), "..", "templates");

const templateCache = new Map<string, Template>();

export async function loadTemplate(templateId: string): Promise<Template> {
  const cached = templateCache.get(templateId);
  if (cached) return cached;

  const filePath = join(TEMPLATES_DIR, `${templateId}.json`);
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Template & { extends?: string };

  let merged: Template;

  if (parsed.extends) {
    const base = await loadTemplate(parsed.extends);
    const { extends: _, ...overrides } = parsed;
    merged = deepMerge(base as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as unknown as Template;
    merged.id = parsed.id;
    merged.name = parsed.name;
  } else {
    merged = parsed;
  }

  templateCache.set(templateId, merged);
  return merged;
}

export function getTerminology(template: Template): TemplateTerminology {
  return template.terminology;
}
