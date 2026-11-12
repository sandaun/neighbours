-- Community administrators publish documents and receipts, with their private
-- PDFs, from the backoffice. Residents keep read-only access.
--
-- Tables: column-limited grants plus admin-only policies, as for the calendar.
-- `id`, `community_id` and a receipt's `unit_id` are fixed after creation; the
-- existing path checks keep each PDF inside its own community/unit namespace.

grant insert (community_id, title, category, file_size_bytes, storage_path)
  on public.documents to authenticated;
grant update (title, category, file_size_bytes, storage_path, updated_at)
  on public.documents to authenticated;
grant delete on public.documents to authenticated;

grant insert (community_id, unit_id, concept, amount_cents, issued_at, period, status, storage_path)
  on public.receipts to authenticated;
grant update (concept, amount_cents, issued_at, period, status, storage_path)
  on public.receipts to authenticated;
grant delete on public.receipts to authenticated;

create policy documents_admin_insert on public.documents for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = documents.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy documents_admin_update on public.documents for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = documents.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = documents.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy documents_admin_delete on public.documents for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = documents.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));

create policy receipts_admin_insert on public.receipts for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = receipts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy receipts_admin_update on public.receipts for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = receipts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = receipts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy receipts_admin_delete on public.receipts for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = receipts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));

-- Storage: admins upload, read and remove PDFs only under their own communities.
-- Uploads must match the same namespaces the table checks enforce, and receipt
-- folders must belong to a unit of that community. Replacing a file in place
-- (UPDATE/upsert) stays denied: the backoffice uploads a new name instead.
grant delete on storage.objects to authenticated;

create policy community_files_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'community-documents' and exists (
    select 1 from public.community_members m
    where m.user_id = (select auth.uid()) and m.role = 'admin'
      and objects.name like m.community_id::text || '/%'));

create policy community_files_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'community-documents' and exists (
    select 1 from public.community_members m
    where m.user_id = (select auth.uid()) and m.role = 'admin'
      and (
        objects.name ~ ('^' || m.community_id::text || '/documents/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$')
        or exists (
          select 1 from public.units u
          where u.community_id = m.community_id
            and objects.name ~ ('^' || m.community_id::text || '/receipts/' || u.id::text || '/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$')
        )
      )));

create policy community_files_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'community-documents' and exists (
    select 1 from public.community_members m
    where m.user_id = (select auth.uid()) and m.role = 'admin'
      and objects.name like m.community_id::text || '/%'));
