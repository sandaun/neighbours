-- Transactional TAP test: supabase test db. All fixtures roll back.
-- Counts are scoped to this test's fixtures: a real project already has data.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

create function pg_temp.assert_denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation or foreign_key_violation then
    return;
  end;
  raise exception 'Expected denied operation: %', statement;
end;
$$;

create function pg_temp.assert_no_mutation(statement text) returns void language plpgsql as $$
declare
  affected_rows bigint;
begin
  begin
    execute statement;
    get diagnostics affected_rows = row_count;
  exception when insufficient_privilege then
    return;
  end;
  if affected_rows <> 0 then
    raise exception 'Expected no mutation, affected % rows: %', affected_rows, statement;
  end if;
end;
$$;

-- Community A: 91 (units A1 = 91, A2 = 92, empty A3 = 93). Community B: 92 (unit B1 = 94).
-- Users: 91 admin A (also lives in B), 92 resident A1, 93 second admin of A,
-- 94 resident A2, 95 admin B, 96 resident B1.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000091', 'members-admin-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000092', 'members-resident-a1@example.invalid'),
  ('00000000-0000-0000-0000-000000000093', 'members-admin-a2@example.invalid'),
  ('00000000-0000-0000-0000-000000000094', 'members-resident-a2@example.invalid'),
  ('00000000-0000-0000-0000-000000000095', 'members-admin-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000096', 'members-resident-b1@example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-000000000091', 'Members A'),
  ('10000000-0000-0000-0000-000000000092', 'Members B');
insert into public.units (id, community_id, label) values
  ('20000000-0000-0000-0000-000000000091', '10000000-0000-0000-0000-000000000091', 'A1'),
  ('20000000-0000-0000-0000-000000000092', '10000000-0000-0000-0000-000000000091', 'A2'),
  ('20000000-0000-0000-0000-000000000093', '10000000-0000-0000-0000-000000000091', 'A3'),
  ('20000000-0000-0000-0000-000000000094', '10000000-0000-0000-0000-000000000092', 'B1');
insert into public.community_members (community_id, user_id, unit_id, display_name, role) values
  ('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', null, 'Admin A', 'admin'),
  ('10000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000094', 'Admin A at home', 'resident'),
  ('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000091', 'Resident A1', 'resident'),
  ('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000093', null, 'Second admin A', 'admin'),
  ('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000094', '20000000-0000-0000-0000-000000000092', 'Resident A2', 'resident'),
  ('10000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000095', null, 'Admin B', 'admin'),
  ('10000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000096', '20000000-0000-0000-0000-000000000094', 'Resident B1', 'resident');
insert into public.receipts (community_id, unit_id, concept, amount_cents, issued_at, period, status) values
  ('10000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000092', 'Fee A2', 100, '2026-11-01', 'November', 'paid');

do $$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.admin_list_members(uuid)'::regprocedure,
    'public.admin_update_member(uuid,uuid,text,uuid)'::regprocedure,
    'public.admin_remove_member(uuid,uuid)'::regprocedure
  ] loop
    assert (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = fn), format('%s is definer with pinned search path', fn);
    assert has_function_privilege('authenticated', fn, 'EXECUTE'), format('%s callable when signed in', fn);
    assert not has_function_privilege('anon', fn, 'EXECUTE'), format('%s not callable anonymously', fn);
  end loop;
  -- No direct membership writes for clients.
  assert not has_table_privilege('authenticated', 'public.community_members', 'INSERT,UPDATE,DELETE'), 'Memberships are not client writable';
  assert not has_column_privilege('authenticated', 'public.units', 'community_id', 'UPDATE'), 'Unit community is immutable';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000091', true);
do $$
begin
  -- Listing: everyone in A, with emails; never another community.
  assert (select count(*) = 4 from public.admin_list_members('10000000-0000-0000-0000-000000000091')), 'Admin lists the four members of A';
  assert (select email = 'members-resident-a1@example.invalid' from public.admin_list_members('10000000-0000-0000-0000-000000000091') where user_id = '00000000-0000-0000-0000-000000000092'), 'Admin sees resident emails';
  perform pg_temp.assert_denied($q$select * from public.admin_list_members('10000000-0000-0000-0000-000000000092')$q$);
  perform pg_temp.assert_denied($q$select * from public.admin_list_members('10000000-0000-0000-0000-0000000000ff')$q$);
  -- Direct reads still show only the caller's own memberships.
  assert (select count(*) = 2 from public.community_members), 'Table reads stay limited to self';

  -- Updating residents: name and unit within A.
  perform public.admin_update_member('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000092', '  Anna Puig  ', '20000000-0000-0000-0000-000000000093');
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000092','Anna','20000000-0000-0000-0000-000000000094')$q$);
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000092','   ','20000000-0000-0000-0000-000000000093')$q$);
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000093','Renamed admin',null)$q$);
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000091','Myself',null)$q$);
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000092','00000000-0000-0000-0000-000000000096','Cross community','20000000-0000-0000-0000-000000000094')$q$);
  -- A resident of B addressed through community A is still out of reach.
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000096','Cross community',null)$q$);

  -- Removing: residents of A only; never admins, never oneself, never B.
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000093')$q$);
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000091')$q$);
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000092','00000000-0000-0000-0000-000000000096')$q$);
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000092','00000000-0000-0000-0000-000000000091')$q$);
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000096')$q$);
  perform public.admin_remove_member('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000094');
  assert (select count(*) = 3 from public.admin_list_members('10000000-0000-0000-0000-000000000091')), 'Removed resident is gone from A';

  -- Units.
  insert into public.units (community_id, label, balance_cents) values ('10000000-0000-0000-0000-000000000091', 'Àtic', -12000);
  update public.units set label = 'A3 bis', next_charge_at = '2026-12-01', next_charge_cents = 9000 where id = '20000000-0000-0000-0000-000000000093';
  assert found, 'Admin edits a unit';
  perform pg_temp.assert_denied($q$update public.units set next_charge_at = '2026-12-01', next_charge_cents = null where id = '20000000-0000-0000-0000-000000000091'$q$);
  perform pg_temp.assert_denied($q$insert into public.units(community_id,label) values ('10000000-0000-0000-0000-000000000092','Cross')$q$);
  perform pg_temp.assert_denied($q$update public.units set community_id = '10000000-0000-0000-0000-000000000092' where id = '20000000-0000-0000-0000-000000000091'$q$);
  perform pg_temp.assert_no_mutation($q$update public.units set label = 'Forged' where id = '20000000-0000-0000-0000-000000000094'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.units where id = '20000000-0000-0000-0000-000000000094'$q$);
  -- Units with residents or receipts are protected by foreign keys.
  perform pg_temp.assert_denied($q$delete from public.units where id = '20000000-0000-0000-0000-000000000093'$q$);
  perform pg_temp.assert_denied($q$delete from public.units where id = '20000000-0000-0000-0000-000000000092'$q$);
  delete from public.units where community_id = '10000000-0000-0000-0000-000000000091' and label = 'Àtic';
  assert found, 'Admin deletes an empty unit';
end;
$$;

-- Residents cannot use any of it.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000092', true);
do $$
begin
  perform pg_temp.assert_denied($q$select * from public.admin_list_members('10000000-0000-0000-0000-000000000091')$q$);
  perform pg_temp.assert_denied($q$select public.admin_update_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000092','Self rename',null)$q$);
  perform pg_temp.assert_denied($q$select public.admin_remove_member('10000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000092')$q$);
  perform pg_temp.assert_denied($q$insert into public.units(community_id,label) values ('10000000-0000-0000-0000-000000000091','Resident unit')$q$);
  perform pg_temp.assert_no_mutation('update public.units set balance_cents = 0');
  perform pg_temp.assert_no_mutation('delete from public.units');
end;
$$;

-- Revoking the admin role is effective immediately.
reset role;
update public.community_members set role = 'resident'
where user_id = '00000000-0000-0000-0000-000000000091' and community_id = '10000000-0000-0000-0000-000000000091';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000091', true);
do $$
begin
  perform pg_temp.assert_denied($q$select * from public.admin_list_members('10000000-0000-0000-0000-000000000091')$q$);
  perform pg_temp.assert_no_mutation('delete from public.units');
end;
$$;

reset role;
set local role anon;
do $$
begin
  perform pg_temp.assert_denied($q$select * from public.admin_list_members('10000000-0000-0000-0000-000000000091')$q$);
end;
$$;

reset role;
do $$
begin
  assert (select display_name = 'Anna Puig' and unit_id = '20000000-0000-0000-0000-000000000093'
    from public.community_members where user_id = '00000000-0000-0000-0000-000000000092'), 'Resident update kept, name trimmed';
  assert (select count(*) = 2 from public.community_members where user_id = '00000000-0000-0000-0000-000000000091'), 'Admin kept both memberships';
  assert (select display_name = 'Second admin A' from public.community_members where user_id = '00000000-0000-0000-0000-000000000093'), 'Other admin untouched';
  assert (select count(*) = 3 from public.community_members where community_id = '10000000-0000-0000-0000-000000000092'), 'Community B memberships untouched (admin B, resident B1, admin A at home)';
  assert (select label = 'B1' from public.units where id = '20000000-0000-0000-0000-000000000094'), 'Community B unit untouched';
  assert (select count(*) = 1 from auth.users where id = '00000000-0000-0000-0000-000000000094'), 'Removing access keeps the account';
end;
$$;
select 'ok 1 - admin units and resident memberships: listing, updates, removal, isolation, residents, revocation, anonymous';
rollback;
