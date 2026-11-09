-- Emergency rollback for the backoffice migrations:
--   20261109100000_admin_incident_updates
--   20261109110000_admin_community_content
--   20261109120000_admin_documents_receipts
-- Returns clients to the resident-only permissions of the earlier migrations.
-- It removes no data: rows and files written from the backoffice stay in place.
-- Run as the project owner in the SQL editor, only if the backoffice must be
-- disabled. Afterwards, mark the three versions as reverted in migration history
-- (supabase migration repair <version> --status reverted) before pushing again.
begin;

drop function if exists public.admin_add_incident_update(uuid, text, text);

drop policy if exists events_admin_insert on public.community_events;
drop policy if exists events_admin_update on public.community_events;
drop policy if exists events_admin_delete on public.community_events;
drop policy if exists board_posts_admin_read on public.board_posts;
drop policy if exists board_posts_admin_insert on public.board_posts;
drop policy if exists board_posts_admin_update on public.board_posts;
drop policy if exists board_posts_admin_delete on public.board_posts;
drop policy if exists directory_contacts_admin_insert on public.directory_contacts;
drop policy if exists directory_contacts_admin_update on public.directory_contacts;
drop policy if exists directory_contacts_admin_delete on public.directory_contacts;
drop policy if exists documents_admin_insert on public.documents;
drop policy if exists documents_admin_update on public.documents;
drop policy if exists documents_admin_delete on public.documents;
drop policy if exists receipts_admin_insert on public.receipts;
drop policy if exists receipts_admin_update on public.receipts;
drop policy if exists receipts_admin_delete on public.receipts;
drop policy if exists community_files_admin_read on storage.objects;
drop policy if exists community_files_admin_insert on storage.objects;
drop policy if exists community_files_admin_delete on storage.objects;

-- Table-level REVOKE also removes the column-level grants.
revoke insert, update, delete on public.community_events, public.board_posts,
  public.directory_contacts, public.documents, public.receipts from authenticated;

-- storage.objects DELETE is deliberately left as is: Supabase may grant it by
-- default, and without a matching policy it affects no rows.

commit;
