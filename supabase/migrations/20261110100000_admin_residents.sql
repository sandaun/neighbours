-- Community administrators manage units and resident memberships from the
-- backoffice. Creating accounts and changing roles stay with the project owner.
--
-- Units: column-limited grants and admin-only policies, as for the calendar.
-- Units with residents or receipts cannot be deleted (existing foreign keys).
grant insert (community_id, label, balance_cents, next_charge_at, next_charge_cents)
  on public.units to authenticated;
grant update (label, balance_cents, next_charge_at, next_charge_cents)
  on public.units to authenticated;
grant delete on public.units to authenticated;

create policy units_admin_insert on public.units for insert to authenticated
  with check (exists (select 1 from public.community_members m
    where m.community_id = units.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy units_admin_update on public.units for update to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = units.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'))
  with check (exists (select 1 from public.community_members m
    where m.community_id = units.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));
create policy units_admin_delete on public.units for delete to authenticated
  using (exists (select 1 from public.community_members m
    where m.community_id = units.community_id and m.user_id = (select auth.uid()) and m.role = 'admin'));

-- Memberships: three narrow functions instead of table policies. A policy on
-- community_members that reads community_members would recurse, and resident
-- emails live in auth.users, which clients cannot read. Each function checks that
-- the caller administers the community and only ever touches resident rows, so
-- an admin cannot change or remove another admin, nor their own access.

create function public.admin_list_members(p_community_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  unit_id uuid,
  role text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = auth.uid() and m.role = 'admin'
  ) then
    raise exception 'Community not administered by the caller' using errcode = '42501';
  end if;

  return query
  select m.user_id, m.display_name, u.email::text, m.unit_id, m.role, m.created_at
  from public.community_members m
  join auth.users u on u.id = m.user_id
  where m.community_id = p_community_id
  order by m.display_name, m.user_id;
end;
$$;

create function public.admin_update_member(
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
    where m.community_id = p_community_id and m.user_id = auth.uid() and m.role = 'admin'
  ) then
    raise exception 'Community not administered by the caller' using errcode = '42501';
  end if;
  if v_name is null or char_length(v_name) not between 1 and 160 then
    raise exception 'Display name must have 1 to 160 characters' using errcode = '23514';
  end if;

  -- The composite foreign key rejects a unit from another community.
  update public.community_members
  set display_name = v_name, unit_id = p_unit_id
  where community_id = p_community_id and user_id = p_user_id and role = 'resident';
  if not found then
    raise exception 'Resident not found in this community' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_remove_member(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = auth.uid() and m.role = 'admin'
  ) then
    raise exception 'Community not administered by the caller' using errcode = '42501';
  end if;

  -- Removes access only: the Auth account, incidents and receipts remain.
  delete from public.community_members
  where community_id = p_community_id and user_id = p_user_id and role = 'resident';
  if not found then
    raise exception 'Resident not found in this community' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.admin_list_members(uuid) from public, anon, authenticated;
revoke all on function public.admin_update_member(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_remove_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_list_members(uuid) to authenticated, service_role;
grant execute on function public.admin_update_member(uuid, uuid, text, uuid) to authenticated, service_role;
grant execute on function public.admin_remove_member(uuid, uuid) to authenticated, service_role;
