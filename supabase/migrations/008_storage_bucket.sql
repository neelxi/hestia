-- Documents storage bucket for client/project file uploads
-- Path format: documents/{client_id}/{uuid}_{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Team/admin: full access (SELECT, INSERT, UPDATE, DELETE)
create policy "team_admin_documents_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and public.get_user_role() in ('admin', 'team')
);

create policy "team_admin_documents_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.get_user_role() in ('admin', 'team')
);

create policy "team_admin_documents_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and public.get_user_role() in ('admin', 'team')
);

create policy "team_admin_documents_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.get_user_role() in ('admin', 'team')
);

-- Client: read own documents only (path starts with their client_id)
create policy "client_documents_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and public.get_user_role() = 'client'
  and (storage.foldername(name))[1] = public.get_user_client_id()::text
);
