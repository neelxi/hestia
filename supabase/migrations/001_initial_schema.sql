-- Hestia: Unified Business Operations Platform
-- Single-tenant schema: one workspace per deployment. No company_id scoping.

-- ============================================================================
-- CORE TABLES
-- ============================================================================

create table public.workspace (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'generic',
  template_id text not null default 'base',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'team' check (role in ('admin', 'team', 'client')),
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'prospect')),
  external_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active',
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  source text not null default 'manual',
  content text not null default '',
  type text not null default 'note' check (type in ('meeting_transcript', 'note', 'email', 'call')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.directives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text not null default 'operations',
  is_automated boolean not null default false,
  trigger_conditions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.directive_runs (
  id uuid primary key default gen_random_uuid(),
  directive_id uuid not null references public.directives(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  input jsonb not null default '{}',
  output jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_type text not null default 'user' check (actor_type in ('user', 'mcp-agent', 'system')),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

create table public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  auth_type text not null default 'api_key' check (auth_type in ('oauth', 'api_key', 'webhook_only')),
  config_schema jsonb not null default '{}',
  logo_url text,
  description text
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.integration_providers(id) on delete cascade,
  credentials_encrypted text,
  field_mappings jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'error')),
  last_synced_at timestamptz,
  webhook_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  event_type text not null,
  raw_payload jsonb not null default '{}',
  processed_status text not null default 'pending' check (processed_status in ('pending', 'processed', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create table public.field_mappings (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  external_field text not null,
  internal_table text not null,
  internal_field text not null,
  transform_fn text
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_profiles_user on public.profiles(user_id);
create index idx_clients_email on public.clients(email);
create index idx_clients_external on public.clients(external_id);
create index idx_projects_client on public.projects(client_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_status on public.tasks(status);
create index idx_documents_client on public.documents(client_id);
create index idx_notes_client on public.notes(client_id);
create index idx_notes_type on public.notes(type);
create index idx_directive_runs_directive on public.directive_runs(directive_id);
create index idx_activity_entity on public.activity_log(entity_type, entity_id);
create index idx_activity_created on public.activity_log(created_at desc);
create index idx_integration_events_integration on public.integration_events(integration_id);
create index idx_integration_events_status on public.integration_events(processed_status);
create index idx_field_mappings_integration on public.field_mappings(integration_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.workspace
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.notes
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.directives
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.integrations
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.workspace enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.notes enable row level security;
alter table public.directives enable row level security;
alter table public.directive_runs enable row level security;
alter table public.activity_log enable row level security;
alter table public.integration_providers enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_events enable row level security;
alter table public.field_mappings enable row level security;

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid()
$$ language sql security definer stable;

-- Helper: get the client record id linked to a client-role user (match by email)
create or replace function public.get_user_client_id()
returns uuid as $$
  select id from public.clients
  where email = (select email from auth.users where id = auth.uid())
  limit 1
$$ language sql security definer stable;

-- Workspace: admins can read/update
create policy "admins_see_workspace" on public.workspace
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "admins_update_workspace" on public.workspace
  for update using (public.get_user_role() = 'admin');

-- Profiles: users see all profiles in workspace
create policy "users_see_profiles" on public.profiles
  for select using (true);

create policy "admins_manage_profiles" on public.profiles
  for all using (public.get_user_role() = 'admin');

create policy "users_update_own_profile" on public.profiles
  for update using (user_id = auth.uid());

-- Clients: team/admin see all; client sees only their own
create policy "team_see_clients" on public.clients
  for select using (
    public.get_user_role() in ('admin', 'team') or id = public.get_user_client_id()
  );

create policy "team_manage_clients" on public.clients
  for all using (public.get_user_role() in ('admin', 'team'));

-- Projects: team/admin see all; client sees linked
create policy "team_see_projects" on public.projects
  for select using (
    public.get_user_role() in ('admin', 'team') or client_id = public.get_user_client_id()
  );

create policy "team_manage_projects" on public.projects
  for all using (public.get_user_role() in ('admin', 'team'));

-- Tasks: team/admin see all; client sees linked
create policy "team_see_tasks" on public.tasks
  for select using (
    public.get_user_role() in ('admin', 'team') or client_id = public.get_user_client_id()
  );

create policy "team_manage_tasks" on public.tasks
  for all using (public.get_user_role() in ('admin', 'team'));

-- Documents: team/admin see all; client sees linked
create policy "team_see_documents" on public.documents
  for select using (
    public.get_user_role() in ('admin', 'team') or client_id = public.get_user_client_id()
  );

create policy "team_manage_documents" on public.documents
  for all using (public.get_user_role() in ('admin', 'team'));

-- Notes: team/admin see all; client sees linked
create policy "team_see_notes" on public.notes
  for select using (
    public.get_user_role() in ('admin', 'team') or client_id = public.get_user_client_id()
  );

create policy "team_manage_notes" on public.notes
  for all using (public.get_user_role() in ('admin', 'team'));

-- Directives: team/admin only
create policy "team_see_directives" on public.directives
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "admin_manage_directives" on public.directives
  for all using (public.get_user_role() = 'admin');

-- Directive runs: team/admin only
create policy "team_see_directive_runs" on public.directive_runs
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "team_manage_directive_runs" on public.directive_runs
  for all using (public.get_user_role() in ('admin', 'team'));

-- Activity log: team/admin see all
create policy "team_see_activity" on public.activity_log
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "team_insert_activity" on public.activity_log
  for insert with check (public.get_user_role() in ('admin', 'team'));

-- Integration providers: all authenticated users can read
create policy "all_read_providers" on public.integration_providers
  for select using (true);

-- Integrations: admin only
create policy "admin_manage_integrations" on public.integrations
  for all using (public.get_user_role() = 'admin');

create policy "team_see_integrations" on public.integrations
  for select using (public.get_user_role() in ('admin', 'team'));

-- Integration events: admin/team can read
create policy "team_see_events" on public.integration_events
  for select using (
    exists (
      select 1 from public.integrations i
      where i.id = integration_id
    )
    and public.get_user_role() in ('admin', 'team')
  );

-- Field mappings: admin manages
create policy "admin_manage_mappings" on public.field_mappings
  for all using (
    exists (
      select 1 from public.integrations i
      where i.id = integration_id
    )
    and public.get_user_role() = 'admin'
  );

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP (single-tenant: first user = admin, rest = team)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
  user_role text;
begin
  select not exists (select 1 from public.profiles limit 1) into is_first;
  user_role := coalesce(new.raw_user_meta_data->>'role', case when is_first then 'admin' else 'team' end);

  insert into public.profiles (user_id, role, display_name)
  values (
    new.id,
    user_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
