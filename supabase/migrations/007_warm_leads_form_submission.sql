-- Allow public form submissions to warm_leads (blueprint, waitlist).
-- Make brokerage_name nullable for waitlist (email-only) signups.
-- Add anon insert policy (same pattern as applications).

alter table public.warm_leads
  alter column brokerage_name drop not null;

-- Anonymous users can insert (public lead magnet / waitlist forms)
create policy "anon_insert_warm_leads" on public.warm_leads
  for insert with check (true);
