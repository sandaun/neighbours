-- Community administrators maintain the calendar, board, and provider directory
-- from the backoffice. Residents keep read-only access: the new grants are
-- matched only by admin policies, so resident INSERTs raise an RLS violation and
-- resident UPDATE/DELETE statements affect no rows.
--
-- Column grants leave `id` and `community_id` immutable after creation, so a row
-- can never be moved to another community.

grant insert (community_id, title, location, starts_at, ends_at)
  on public.community_events to authenticated;
grant update (title, location, starts_at, ends_at) on public.community_events to authenticated;
grant delete on public.community_events to authenticated;

grant insert (community_id, title, body, author_name, topic, published_at)
  on public.board_posts to authenticated;
grant update (title, body, author_name, topic, published_at) on public.board_posts to authenticated;
grant delete on public.board_posts to authenticated;

grant insert (community_id, name, service, phone, email, hours, sort_order)
  on public.directory_contacts to authenticated;
grant update (name, service, phone, email, hours, sort_order)
  on public.directory_contacts to authenticated;
grant delete on public.directory_contacts to authenticated;

-- Calendar events.
create policy events_admin_insert on public.community_events for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = community_events.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy events_admin_update on public.community_events for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = community_events.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = community_events.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy events_admin_delete on public.community_events for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = community_events.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));

-- Board posts. Admins also read scheduled posts that residents cannot see yet.
create policy board_posts_admin_read on public.board_posts for select to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy board_posts_admin_insert on public.board_posts for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy board_posts_admin_update on public.board_posts for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy board_posts_admin_delete on public.board_posts for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));

-- Provider directory.
create policy directory_contacts_admin_insert on public.directory_contacts for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = directory_contacts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy directory_contacts_admin_update on public.directory_contacts for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = directory_contacts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = directory_contacts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy directory_contacts_admin_delete on public.directory_contacts for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = directory_contacts.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
