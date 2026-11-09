-- Community administrators answer incidents from the backoffice.
--
-- One narrow entry point instead of new table grants: residents already hold
-- UPDATE(photo_path) on incidents through a reporter policy, and permissive
-- policies are OR'ed, so granting UPDATE(status) to `authenticated` would also
-- let reporters change the status of their own incidents. This function keeps
-- every existing grant and policy unchanged, checks the caller's admin role
-- itself, and changes the status and appends the update in one transaction.
create function public.admin_add_incident_update(
  p_incident_id uuid,
  p_body text,
  p_status text default null
)
returns public.incident_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_incident public.incidents;
  v_author text;
  v_update public.incident_updates;
begin
  if v_caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select i.* into v_incident from public.incidents i where i.id = p_incident_id for update;
  if found then
    select m.display_name into v_author
    from public.community_members m
    where m.community_id = v_incident.community_id
      and m.user_id = v_caller
      and m.role = 'admin';
  end if;
  -- Same error whether the incident is missing or belongs to another community.
  if v_author is null then
    raise exception 'Incident not found or not administered by the caller' using errcode = '42501';
  end if;

  if p_status is not null and p_status is distinct from v_incident.status then
    update public.incidents set status = p_status where id = v_incident.id;
  end if;

  -- The author is always the caller's own membership name, never client input.
  insert into public.incident_updates (incident_id, body, author_name, status)
  values (v_incident.id, btrim(p_body), v_author, p_status)
  returning * into v_update;

  return v_update;
end;
$$;

revoke all on function public.admin_add_incident_update(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_add_incident_update(uuid, text, text) to authenticated, service_role;
