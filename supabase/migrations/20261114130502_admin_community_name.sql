-- The existing admin update policy limits name changes to the same community.
grant update (name) on public.communities to authenticated;

alter policy communities_admin_update_address on public.communities
  rename to communities_admin_update_details;
