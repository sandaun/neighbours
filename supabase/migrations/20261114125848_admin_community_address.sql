-- Community administrators may update the address of their own communities.
grant update (address_line, municipality) on public.communities to authenticated;

create policy communities_admin_update_address on public.communities
  for update to authenticated
  using (exists (
    select 1 from public.community_members m
    where m.community_id = communities.id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  ))
  with check (exists (
    select 1 from public.community_members m
    where m.community_id = communities.id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  ));
