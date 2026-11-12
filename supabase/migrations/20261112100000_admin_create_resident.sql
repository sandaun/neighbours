-- Support for the admin-create-resident Edge Function, which lets a community
-- administrator add a resident: it creates the Auth account when the email is
-- new (that needs the secret key, so it runs on the server) and then calls
-- service_add_resident. Both functions are callable by service_role only, never
-- by browsers; the community admin check lives here so SQL tests can cover it.

create function public.service_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1
$$;

create function public.service_add_resident(
  p_caller_id uuid,
  p_community_id uuid,
  p_user_id uuid,
  p_display_name text,
  p_unit_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_display_name);
begin
  if not exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = p_caller_id and m.role = 'admin'
  ) then
    raise exception 'Community not administered by the caller' using errcode = '42501';
  end if;
  if v_name is null or char_length(v_name) not between 1 and 160 then
    raise exception 'Display name must have 1 to 160 characters' using errcode = '23514';
  end if;

  -- New members are always residents. The primary key rejects an existing
  -- member (23505) and the composite foreign key a unit from another community
  -- (23503).
  insert into public.community_members (community_id, user_id, unit_id, display_name, role)
  values (p_community_id, p_user_id, p_unit_id, v_name, 'resident');
end;
$$;

revoke all on function public.service_user_id_by_email(text) from public, anon, authenticated;
revoke all on function public.service_add_resident(uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.service_user_id_by_email(text) to service_role;
grant execute on function public.service_add_resident(uuid, uuid, uuid, text, uuid) to service_role;
