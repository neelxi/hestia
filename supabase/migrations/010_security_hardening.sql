-- Harden production authentication defaults.
-- Public signups should also be disabled in Supabase Auth settings. This
-- migration ensures a direct Auth API signup cannot choose its own role.

drop policy if exists "users_see_profiles" on public.profiles;

create policy "authenticated_users_see_profiles" on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null);

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
  user_role := case when is_first then 'admin' else 'client' end;

  insert into public.profiles (user_id, role, display_name)
  values (
    new.id,
    user_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
