-- Add the brokerage demo layer to an existing Hestia database.
-- This migration is additive: it preserves all Hestia tables and records.

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'team', 'client', 'agent'));

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
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

alter table public.profiles
  add column if not exists agent_id uuid references public.agents(id) on delete set null;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  mls_number text,
  status text,
  list_price numeric(12,2),
  sold_price numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
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

create table if not exists public.commissions (
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

create table if not exists public.sops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text not null default 'operations',
  is_automated boolean not null default false,
  trigger_conditions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sop_id uuid references public.sops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null,
  add column if not exists workflow_id uuid references public.workflows(id) on delete set null;

alter table public.documents
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null,
  add column if not exists agent_id uuid references public.agents(id) on delete set null;

create table if not exists public.leads (
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

create table if not exists public.recruiting_prospects (
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

create table if not exists public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  type text not null,
  status text not null,
  expiry_at date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  operation text not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_agent on public.profiles(agent_id);
create index if not exists idx_agents_team on public.agents(team_id);
create index if not exists idx_agents_email on public.agents(email);
create index if not exists idx_agents_status on public.agents(status);
create index if not exists idx_transactions_listing_agent on public.transactions(listing_agent_id);
create index if not exists idx_transactions_buyer_agent on public.transactions(buyer_agent_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_closing on public.transactions(closing_date);
create index if not exists idx_commissions_agent on public.commissions(agent_id);
create index if not exists idx_commissions_transaction on public.commissions(transaction_id);
create index if not exists idx_tasks_transaction on public.tasks(transaction_id);
create index if not exists idx_leads_agent on public.leads(agent_id);
create index if not exists idx_leads_status on public.leads(status);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teams', 'agents', 'properties', 'transactions', 'commissions',
    'sops', 'workflows', 'leads', 'recruiting_prospects',
    'compliance_records', 'settings'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.handle_updated_at()',
      table_name
    );
  end loop;
end $$;

alter table public.teams enable row level security;
alter table public.agents enable row level security;
alter table public.properties enable row level security;
alter table public.transactions enable row level security;
alter table public.commissions enable row level security;
alter table public.sops enable row level security;
alter table public.workflows enable row level security;
alter table public.leads enable row level security;
alter table public.recruiting_prospects enable row level security;
alter table public.compliance_records enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;

create or replace function public.get_user_agent_id()
returns uuid as $$
  select agent_id from public.profiles where user_id = auth.uid() limit 1
$$ language sql security definer stable set search_path = public;

drop policy if exists "team_see_teams" on public.teams;
create policy "team_see_teams" on public.teams for select
  using (public.get_user_role() in ('admin', 'team'));
drop policy if exists "team_manage_teams" on public.teams;
create policy "team_manage_teams" on public.teams for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_agents" on public.agents;
create policy "team_see_agents" on public.agents for select using (
  public.get_user_role() in ('admin', 'team') or id = public.get_user_agent_id()
);
drop policy if exists "team_manage_agents" on public.agents;
create policy "team_manage_agents" on public.agents for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_properties" on public.properties;
create policy "team_see_properties" on public.properties for select
  using (public.get_user_role() in ('admin', 'team'));
drop policy if exists "team_manage_properties" on public.properties;
create policy "team_manage_properties" on public.properties for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_transactions" on public.transactions;
create policy "team_see_transactions" on public.transactions for select using (
  public.get_user_role() in ('admin', 'team')
  or listing_agent_id = public.get_user_agent_id()
  or buyer_agent_id = public.get_user_agent_id()
);
drop policy if exists "team_manage_transactions" on public.transactions;
create policy "team_manage_transactions" on public.transactions for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_commissions" on public.commissions;
create policy "team_see_commissions" on public.commissions for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
drop policy if exists "team_manage_commissions" on public.commissions;
create policy "team_manage_commissions" on public.commissions for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "agent_see_tasks" on public.tasks;
create policy "agent_see_tasks" on public.tasks for select using (
  public.get_user_role() = 'agent' and exists (
    select 1 from public.transactions transaction_row
    where transaction_row.id = public.tasks.transaction_id
      and (
        transaction_row.listing_agent_id = public.get_user_agent_id()
        or transaction_row.buyer_agent_id = public.get_user_agent_id()
      )
  )
);

drop policy if exists "agent_see_documents" on public.documents;
create policy "agent_see_documents" on public.documents for select using (
  public.get_user_role() = 'agent' and (
    agent_id = public.get_user_agent_id()
    or exists (
      select 1 from public.transactions transaction_row
      where transaction_row.id = public.documents.transaction_id
        and (
          transaction_row.listing_agent_id = public.get_user_agent_id()
          or transaction_row.buyer_agent_id = public.get_user_agent_id()
        )
    )
  )
);

drop policy if exists "team_see_sops" on public.sops;
create policy "team_see_sops" on public.sops for select
  using (public.get_user_role() in ('admin', 'team'));
drop policy if exists "admin_manage_sops" on public.sops;
create policy "admin_manage_sops" on public.sops for all
  using (public.get_user_role() = 'admin');
drop policy if exists "team_see_workflows" on public.workflows;
create policy "team_see_workflows" on public.workflows for select
  using (public.get_user_role() in ('admin', 'team'));
drop policy if exists "team_manage_workflows" on public.workflows;
create policy "team_manage_workflows" on public.workflows for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_leads" on public.leads;
create policy "team_see_leads" on public.leads for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
drop policy if exists "team_manage_leads" on public.leads;
create policy "team_manage_leads" on public.leads for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_recruiting" on public.recruiting_prospects;
create policy "team_see_recruiting" on public.recruiting_prospects for select
  using (public.get_user_role() in ('admin', 'team'));
drop policy if exists "team_manage_recruiting" on public.recruiting_prospects;
create policy "team_manage_recruiting" on public.recruiting_prospects for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "team_see_compliance" on public.compliance_records;
create policy "team_see_compliance" on public.compliance_records for select using (
  public.get_user_role() in ('admin', 'team') or agent_id = public.get_user_agent_id()
);
drop policy if exists "team_manage_compliance" on public.compliance_records;
create policy "team_manage_compliance" on public.compliance_records for all
  using (public.get_user_role() in ('admin', 'team'));

drop policy if exists "admin_manage_settings" on public.settings;
create policy "admin_manage_settings" on public.settings for all
  using (public.get_user_role() = 'admin');

drop policy if exists "authenticated_users_see_profiles" on public.profiles;
drop policy if exists "users_see_profiles" on public.profiles;
create policy "authenticated_users_see_profiles" on public.profiles
  for select to authenticated using (auth.uid() is not null);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  user_role text;
begin
  select not exists (select 1 from public.profiles limit 1) into is_first;
  user_role := case when is_first then 'admin' else 'agent' end;

  insert into public.profiles (user_id, role, display_name)
  values (
    new.id,
    user_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

update public.workspace
set type = 'brokerage', template_id = 'brokerage', updated_at = now();
