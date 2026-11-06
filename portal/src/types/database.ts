export type UserRole = "admin" | "team" | "client" | "agent";

export interface Workspace {
  id: string;
  name: string;
  type: string;
  template_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  avatar_url: string | null;
  agent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive" | "prospect";
  external_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  client_id: string | null;
  project_id: string | null;
  name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  client_id: string | null;
  project_id: string | null;
  source: string;
  content: string;
  type: "meeting_transcript" | "note" | "email" | "call";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Directive {
  id: string;
  title: string;
  content: string;
  category: string;
  is_automated: boolean;
  trigger_conditions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DirectiveRun {
  id: string;
  directive_id: string;
  status: "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_type: "user" | "mcp-agent" | "system";
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Integration {
  id: string;
  provider_id: string;
  credentials_encrypted: string | null;
  field_mappings: Record<string, unknown>;
  status: "active" | "paused" | "error";
  last_synced_at: string | null;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationEvent {
  id: string;
  integration_id: string;
  event_type: string;
  raw_payload: Record<string, unknown>;
  processed_status: "pending" | "processed" | "failed";
  error_message: string | null;
  created_at: string;
}

export interface FieldMapping {
  id: string;
  integration_id: string;
  external_field: string;
  internal_table: string;
  internal_field: string;
  transform_fn: string | null;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  auth_type: "oauth" | "api_key" | "webhook_only";
  config_schema: Record<string, unknown>;
  logo_url: string | null;
  description: string | null;
}
