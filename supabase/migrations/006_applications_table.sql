-- Applications: lead form submissions from marketing/website/apply.html
-- Anonymous inserts allowed (public form); team/admin can read.

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

create index idx_applications_email on public.applications(email);
create index idx_applications_created on public.applications(created_at desc);

alter table public.applications enable row level security;

-- Anonymous users can insert (public form)
create policy "anon_insert_applications" on public.applications
  for insert with check (true);

-- Team and admin can read all
create policy "team_read_applications" on public.applications
  for select using (public.get_user_role() in ('admin', 'team'));
