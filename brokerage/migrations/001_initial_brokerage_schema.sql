-- Brokerage AI Operations Framework — Initial Schema
-- For real estate brokerages (ICP). Separate from Hestia (infrastructure provider).
-- Deploy to a dedicated Supabase project for brokerage clients.
-- Based on: The Brokerage AI Operations Blueprint (lead magnet)

-- ============================================================================
-- CORE: WORKSPACE & AUTH
-- ============================================================================

create table public.workspace (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'brokerage',
  template_id text not null default 'brokerage',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'team' check (role in ('admin', 'team', 'agent')),
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================================
-- PEOPLE: AGENTS & TEAMS
-- ============================================================================

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  license_number text,
  license_expiry date,
  team_id uuid references public.teams(id) on delete set null,
  recruited_by_id uuid references public.agents(id) on delete set null,
  tc_id uuid references public.agents(id) on delete set null,
  eo_policy_expiry date,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  external_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column agent_id uuid references public.agents(id) on delete set null;

-- ============================================================================
-- TRANSACTIONS & PROPERTIES
-- ============================================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  mls_number text,
  status text,
  list_price numeric(12,2),
  sold_price numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  list_price numeric(12,2),
  status text not null default 'pending',
  type text,
  listing_agent_id uuid references public.agents(id) on delete set null,
  buyer_agent_id uuid references public.agents(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  closing_date date,
  contingency_date date,
  inspection_deadline timestamptz,
  external_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- COMMISSIONS
-- ============================================================================

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  split_percent numeric(5,2),
  cap_amount numeric(12,2),
  cap_progress numeric(12,2),
  disbursement_at timestamptz,
  amount numeric(12,2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'disputed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- OPERATIONS: TASKS, WORKFLOWS, SOPs
-- ============================================================================

create table public.sops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text not null default 'operations',
  is_automated boolean not null default false,
  trigger_conditions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sop_id uuid references public.sops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'compliance_review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  transaction_id uuid references public.transactions(id) on delete set null,
  workflow_id uuid references public.workflows(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  transaction_id uuid references public.transactions(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- LEADS & RECRUITING
-- ============================================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source text,
  email text not null,
  name text,
  phone text,
  agent_id uuid references public.agents(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'appointment_set', 'converted', 'lost')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiting_prospects (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  license_number text,
  current_brokerage text,
  estimated_volume numeric(12,2),
  source text,
  stage text not null default 'prospect' check (stage in ('prospect', 'contacted', 'meeting_scheduled', 'offer_extended', 'signed', 'lost')),
  last_touchpoint_at timestamptz,
  next_follow_up_at timestamptz,
  assigned_to_id uuid references public.profiles(id) on delete set null,
  converted_agent_id uuid references public.agents(id) on delete set null unique,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- COMPLIANCE
-- ============================================================================

create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  type text not null,
  status text not null,
  expiry_at date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- INTEGRATIONS
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- AUDIT & ACTIVITY
-- ============================================================================

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

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  operation text not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SETTINGS
-- ============================================================================

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- APPLICATIONS & WARM LEADS (from lead magnet / apply form)
-- ============================================================================

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  brokerage text,
  agents text,
  budget text,
  challenge text,
  crm text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.warm_leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  brokerage_name text,
  licensed_agents integer,
  biggest_operational_challenge text,
  source text not null default 'lead_magnet' check (source in ('lead_magnet', 'cold_email', 'website_form', 'referral')),
  source_url text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost')),
  assignee_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_profiles_user on public.profiles(user_id);
create index idx_profiles_agent on public.profiles(agent_id);
create index idx_agents_team on public.agents(team_id);
create index idx_agents_email on public.agents(email);
create index idx_agents_status on public.agents(status);
create index idx_transactions_listing_agent on public.transactions(listing_agent_id);
create index idx_transactions_buyer_agent on public.transactions(buyer_agent_id);
create index idx_transactions_status on public.transactions(status);
create index idx_transactions_closing on public.transactions(closing_date);
create index idx_commissions_agent on public.commissions(agent_id);
create index idx_commissions_transaction on public.commissions(transaction_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_transaction on public.tasks(transaction_id);
create index idx_tasks_status on public.tasks(status);
create index idx_leads_agent on public.leads(agent_id);
create index idx_leads_status on public.leads(status);
create index idx_leads_created on public.leads(created_at desc);
create index idx_activity_entity on public.activity_log(entity_type, entity_id);
create index idx_activity_created on public.activity_log(created_at desc);
create index idx_applications_created on public.applications(created_at desc);
create index idx_warm_leads_created on public.warm_leads(created_at desc);

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

create trigger set_updated_at before update on public.workspace for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.teams for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.agents for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.properties for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.transactions for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.commissions for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.workflows for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.sops for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tasks for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.leads for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.recruiting_prospects for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.integrations for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.settings for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.warm_leads for each row execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.workspace enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.agents enable row level security;
alter table public.properties enable row level security;
alter table public.transactions enable row level security;
alter table public.commissions enable row level security;
alter table public.sops enable row level security;
alter table public.workflows enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.leads enable row level security;
alter table public.recruiting_prospects enable row level security;
alter table public.compliance_records enable row level security;
alter table public.integration_providers enable row level security;
alter table public.integrations enable row level security;
alter table public.activity_log enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;
alter table public.applications enable row level security;
alter table public.warm_leads enable row level security;

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid() limit 1
$$ language sql security definer stable;

-- Helper: get current user's agent_id (when role = 'agent')
create or replace function public.get_user_agent_id()
returns uuid as $$
  select agent_id from public.profiles where user_id = auth.uid() limit 1
$$ language sql security definer stable;

-- Workspace
create policy "admins_see_workspace" on public.workspace for select using (public.get_user_role() in ('admin', 'team'));
create policy "admins_update_workspace" on public.workspace for update using (public.get_user_role() = 'admin');

-- Profiles
create policy "users_see_profiles" on public.profiles for select using (true);
create policy "admins_manage_profiles" on public.profiles for all using (public.get_user_role() = 'admin');
create policy "users_update_own_profile" on public.profiles for update using (user_id = auth.uid());

-- Teams: admin/team see all
create policy "team_see_teams" on public.teams for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_teams" on public.teams for all using (public.get_user_role() in ('admin', 'team'));

-- Agents: admin/team see all; agent sees only self
create policy "team_see_agents" on public.agents for select using (
  public.get_user_role() in ('admin', 'team') or id = public.get_user_agent_id()
);
create policy "team_manage_agents" on public.agents for all using (public.get_user_role() in ('admin', 'team'));

-- Properties: admin/team see all
create policy "team_see_properties" on public.properties for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_properties" on public.properties for all using (public.get_user_role() in ('admin', 'team'));

-- Transactions: admin/team see all; agent sees own (listing or buyer)
create policy "team_see_transactions" on public.transactions for select using (
  public.get_user_role() in ('admin', 'team')
  or listing_agent_id = public.get_user_agent_id()
  or buyer_agent_id = public.get_user_agent_id()
);
create policy "team_manage_transactions" on public.transactions for all using (public.get_user_role() in ('admin', 'team'));

-- Commissions: admin/team see all; agent sees own
create policy "team_see_commissions" on public.commissions for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
create policy "team_manage_commissions" on public.commissions for all using (public.get_user_role() in ('admin', 'team'));

-- Tasks
create policy "team_see_tasks" on public.tasks for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_tasks" on public.tasks for all using (public.get_user_role() in ('admin', 'team'));

-- Documents
create policy "team_see_documents" on public.documents for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_documents" on public.documents for all using (public.get_user_role() in ('admin', 'team'));

-- Leads: admin/team see all; agent sees assigned
create policy "team_see_leads" on public.leads for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
create policy "team_manage_leads" on public.leads for all using (public.get_user_role() in ('admin', 'team'));

-- Recruiting prospects: admin/team only
create policy "team_see_recruiting" on public.recruiting_prospects for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_recruiting" on public.recruiting_prospects for all using (public.get_user_role() in ('admin', 'team'));

-- Compliance: admin/team see all; agent sees own
create policy "team_see_compliance" on public.compliance_records for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
create policy "team_manage_compliance" on public.compliance_records for all using (public.get_user_role() in ('admin', 'team'));

-- SOPs, Workflows
create policy "team_see_sops" on public.sops for select using (public.get_user_role() in ('admin', 'team'));
create policy "admin_manage_sops" on public.sops for all using (public.get_user_role() = 'admin');
create policy "team_see_workflows" on public.workflows for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_workflows" on public.workflows for all using (public.get_user_role() in ('admin', 'team'));

-- Activity log
create policy "team_see_activity" on public.activity_log for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_insert_activity" on public.activity_log for insert with check (public.get_user_role() in ('admin', 'team'));

-- Integrations
create policy "all_read_providers" on public.integration_providers for select using (true);
create policy "admin_manage_integrations" on public.integrations for all using (public.get_user_role() = 'admin');
create policy "team_see_integrations" on public.integrations for select using (public.get_user_role() in ('admin', 'team'));

-- Applications & Warm leads: public insert, team read
create policy "anon_insert_applications" on public.applications for insert with check (true);
create policy "team_read_applications" on public.applications for select using (public.get_user_role() in ('admin', 'team'));

create policy "anon_insert_warm_leads" on public.warm_leads for insert with check (true);
create policy "team_see_warm_leads" on public.warm_leads for select using (public.get_user_role() in ('admin', 'team'));
create policy "team_manage_warm_leads" on public.warm_leads for all using (public.get_user_role() in ('admin', 'team'));

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
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
