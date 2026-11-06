-- Hestia Sales Pipeline
-- Extends clients, adds warm_leads, cold_email_campaigns, cold_campaign_recipients.
-- Single-tenant: no company_id.

-- ============================================================================
-- EXTEND CLIENTS (Hestia: brokerages)
-- ============================================================================

alter table public.clients add column if not exists owner_name text;
alter table public.clients add column if not exists location text;
alter table public.clients add column if not exists size_agents integer;
alter table public.clients add column if not exists annual_gci numeric(14,2);

-- ============================================================================
-- COLD EMAIL CAMPAIGNS (Smartlead) — must exist before warm_leads
-- ============================================================================

create table public.cold_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  campaign_link text,
  external_campaign_id text,

  sent_count integer not null default 0,
  opened_count integer not null default 0,
  open_rate_pct numeric(5,2),
  response_count integer not null default 0,
  response_rate_pct numeric(5,2),

  campaign_started_at timestamptz,
  last_synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- WARM LEADS (lead magnet signups + cold email respondents)
-- ============================================================================

create table public.warm_leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  contact_email text not null,
  contact_phone text,

  brokerage_name text not null,
  licensed_agents integer,
  biggest_operational_challenge text,

  source text not null default 'lead_magnet' check (source in ('lead_magnet', 'cold_email', 'website_form', 'referral')),
  source_url text,

  cold_campaign_id uuid references public.cold_email_campaigns(id) on delete set null,

  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost')),

  converted_to_client_id uuid references public.clients(id) on delete set null,
  converted_at timestamptz,

  assignee_id uuid references public.profiles(id) on delete set null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- COLD CAMPAIGN RECIPIENTS
-- ============================================================================

create table public.cold_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.cold_email_campaigns(id) on delete cascade,

  email text not null,
  name text,

  opened_at timestamptz,
  replied_at timestamptz,

  warm_lead_id uuid references public.warm_leads(id) on delete set null,

  created_at timestamptz not null default now()
);

alter table public.warm_leads
  add column cold_recipient_id uuid references public.cold_campaign_recipients(id) on delete set null;

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_warm_leads_email on public.warm_leads(contact_email);
create index idx_warm_leads_status on public.warm_leads(status);
create index idx_warm_leads_created on public.warm_leads(created_at desc);
create index idx_warm_leads_cold_campaign on public.warm_leads(cold_campaign_id);

create index idx_cold_campaigns_created on public.cold_email_campaigns(created_at desc);

create index idx_cold_recipients_campaign on public.cold_campaign_recipients(campaign_id);
create index idx_cold_recipients_opened on public.cold_campaign_recipients(campaign_id) where opened_at is not null;
create index idx_cold_recipients_replied on public.cold_campaign_recipients(campaign_id) where replied_at is not null;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create trigger set_updated_at before update on public.warm_leads
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.cold_email_campaigns
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.warm_leads enable row level security;
alter table public.cold_email_campaigns enable row level security;
alter table public.cold_campaign_recipients enable row level security;

create policy "team_see_warm_leads" on public.warm_leads
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "team_manage_warm_leads" on public.warm_leads
  for all using (public.get_user_role() in ('admin', 'team'));

create policy "team_see_cold_campaigns" on public.cold_email_campaigns
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "team_manage_cold_campaigns" on public.cold_email_campaigns
  for all using (public.get_user_role() in ('admin', 'team'));

create policy "team_see_cold_recipients" on public.cold_campaign_recipients
  for select using (public.get_user_role() in ('admin', 'team'));

create policy "team_manage_cold_recipients" on public.cold_campaign_recipients
  for all using (public.get_user_role() in ('admin', 'team'));
