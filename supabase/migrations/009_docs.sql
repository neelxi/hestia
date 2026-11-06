-- Docs: internal documentation table (Hestia)
-- Team can read; admin can manage (create, update, delete).

create table public.docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_docs_slug on public.docs(slug);
create index idx_docs_category on public.docs(category);

create trigger set_updated_at before update on public.docs
  for each row execute function public.handle_updated_at();

alter table public.docs enable row level security;

-- Team and admin can read
create policy "team_read_docs" on public.docs
  for select using (public.get_user_role() in ('admin', 'team'));

-- Admin only can insert, update, delete
create policy "admin_insert_docs" on public.docs
  for insert with check (public.get_user_role() = 'admin');

create policy "admin_update_docs" on public.docs
  for update using (public.get_user_role() = 'admin');

create policy "admin_delete_docs" on public.docs
  for delete using (public.get_user_role() = 'admin');
