-- Drop brokerage_name from clients. Use clients.name for company/display name only.
alter table public.clients drop column if exists brokerage_name;
