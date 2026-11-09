-- Transactional TAP test: supabase test db. All fixtures roll back.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

-- Any failure the function can raise for a rejected call.
create function pg_temp.assert_rejected(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation or not_null_violation then
    return;
  end;
  raise exception 'Expected rejected call: %', statement;
end;
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000021', 'admin-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000022', 'resident-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000023', 'admin-b@example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-000000000021', 'Admin community A'),
  ('10000000-0000-0000-0000-000000000022', 'Admin community B');
insert into public.units (id, community_id, label) values
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', 'A1');
insert into public.community_members (community_id, user_id, unit_id, display_name, role) values
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', null, 'Admin A', 'admin'),
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000021', 'Resident A', 'resident'),
  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', null, 'Admin B', 'admin');
insert into public.incidents (id, community_id, reporter_id, title, description, location, category) values
  ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', 'Broken light', 'The entrance light is broken', 'Entrance', 'electrical'),
  ('30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', 'Water leak', 'The garage pipe is leaking', 'Garage', 'plumbing');

-- Function shape: definer with a pinned search path, executable only by signed-in users.
do $$
declare
  fn regprocedure := 'public.admin_add_incident_update(uuid,text,text)'::regprocedure;
begin
  assert (select prosecdef from pg_proc where oid = fn), 'Function runs as definer';
  assert (select proconfig @> array['search_path=""'] from pg_proc where oid = fn), 'Search path is pinned';
  assert has_function_privilege('authenticated', fn, 'EXECUTE'), 'Signed-in users may call it';
  assert has_function_privilege('service_role', fn, 'EXECUTE'), 'Service role may call it';
  assert not has_function_privilege('anon', fn, 'EXECUTE'), 'Anonymous users may not call it';
  -- Existing grants stay as they were: no direct status edits or update inserts.
  assert not has_column_privilege('authenticated', 'public.incidents', 'status', 'UPDATE'), 'No direct status grant';
  assert not has_table_privilege('authenticated', 'public.incident_updates', 'INSERT'), 'No direct update grant';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
do $$
declare
  result public.incident_updates;
begin
  -- Status change and update are written together; the author comes from the membership.
  result := public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', '  An electrician is on the way  ', 'in-progress');
  assert result.author_name = 'Admin A', 'Author is the admin display name';
  assert result.body = 'An electrician is on the way', 'Body is trimmed';
  assert result.status = 'in-progress', 'Update records the status';
  assert (select status = 'in-progress' from public.incidents where id = '30000000-0000-0000-0000-000000000021'), 'Incident status changed';

  -- A comment without a status keeps the incident status.
  result := public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Parts ordered');
  assert result.status is null, 'Comment has no status';
  assert (select status = 'in-progress' from public.incidents where id = '30000000-0000-0000-0000-000000000021'), 'Comment keeps status';
  assert (select count(*) = 2 from public.incident_updates where incident_id = '30000000-0000-0000-0000-000000000021'), 'Admin sees both updates';

  -- Another community's incident and an unknown id are rejected alike.
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000022', 'Cross community', 'resolved')$q$);
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-0000000000ff', 'Unknown incident', 'resolved')$q$);

  -- Invalid input changes nothing, including a status that was valid on its own.
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Bad status', 'deleted')$q$);
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', '   ', 'resolved')$q$);
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', null, 'resolved')$q$);
  perform pg_temp.assert_rejected(format($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', %L, 'resolved')$q$, repeat('x', 4001)));
  assert (select status = 'in-progress' from public.incidents where id = '30000000-0000-0000-0000-000000000021'), 'Rejected calls keep status';
  assert (select count(*) = 2 from public.incident_updates where incident_id = '30000000-0000-0000-0000-000000000021'), 'Rejected calls add no update';

  -- The admin still has no direct write path.
  perform pg_temp.assert_rejected('update public.incidents set status = ''resolved''');
  perform pg_temp.assert_rejected($q$insert into public.incident_updates(incident_id,body,author_name) values ('30000000-0000-0000-0000-000000000021','Forged','Someone else')$q$);
end;
$$;

-- The reporter, a resident, cannot use the function or change status directly.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', true);
do $$
begin
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Resident closes own incident', 'resolved')$q$);
  perform pg_temp.assert_rejected('update public.incidents set status = ''resolved''');
  assert (select status = 'in-progress' from public.incidents where id = '30000000-0000-0000-0000-000000000021'), 'Resident cannot change status';
  assert (select count(*) = 2 from public.incident_updates), 'Resident reads the admin updates';
end;
$$;

-- The other community's admin cannot reach community A.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000023', true);
do $$
begin
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Wrong community', 'resolved')$q$);
  perform public.admin_add_incident_update('30000000-0000-0000-0000-000000000022', 'A plumber is on the way', 'in-progress');
  assert (select count(*) = 1 from public.incident_updates), 'Admin B sees only community B updates';
end;
$$;

-- A missing JWT subject is rejected.
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'No subject', 'resolved')$q$);
end;
$$;

-- Revoking the admin membership is effective immediately.
reset role;
delete from public.community_members where user_id = '00000000-0000-0000-0000-000000000021';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
do $$
begin
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Revoked admin', 'resolved')$q$);
end;
$$;

reset role;
set local role anon;
do $$
begin
  perform pg_temp.assert_rejected($q$select public.admin_add_incident_update('30000000-0000-0000-0000-000000000021', 'Anonymous', 'resolved')$q$);
end;
$$;

reset role;
do $$
begin
  assert (select status = 'in-progress' from public.incidents where id = '30000000-0000-0000-0000-000000000021'), 'Final status is unchanged by rejected calls';
  assert (select count(*) = 3 from public.incident_updates), 'Exactly the three accepted updates exist';
end;
$$;
select 'ok 1 - admin incident updates: atomic status/update, author, isolation, residents, revocation, anonymous';
rollback;
