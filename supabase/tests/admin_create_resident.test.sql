-- Transactional TAP test: supabase test db. All fixtures roll back.
-- Counts are scoped to this test's fixtures: a real project already has data.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

create function pg_temp.assert_rejected(statement text, expected text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate <> expected then
      raise exception 'Expected SQLSTATE % but got % (%): %', expected, sqlstate, sqlerrm, statement;
    end if;
    return;
  end;
  raise exception 'Expected rejected call (%): %', expected, statement;
end;
$$;

-- Community A: a1 (admin), unit A1. Community B: unit B1. New user: n1.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'create-admin-a@example.invalid'),
  ('00000000-0000-0000-0000-0000000000a2', 'create-resident-a@example.invalid'),
  ('00000000-0000-0000-0000-0000000000a3', 'Create-Newcomer@Example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-0000000000a1', 'Create A'),
  ('10000000-0000-0000-0000-0000000000a2', 'Create B');
insert into public.units (id, community_id, label) values
  ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 'A1'),
  ('20000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-0000000000a2', 'B1');
insert into public.community_members (community_id, user_id, unit_id, display_name, role) values
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', null, 'Admin A', 'admin'),
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-0000000000a1', 'Resident A', 'resident');

-- Only the server (service_role) may call these functions.
do $$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.service_user_id_by_email(text)'::regprocedure,
    'public.service_add_resident(uuid,uuid,uuid,text,uuid)'::regprocedure
  ] loop
    assert (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = fn), format('%s is definer with pinned search path', fn);
    assert has_function_privilege('service_role', fn, 'EXECUTE'), format('%s callable by the server', fn);
    assert not has_function_privilege('authenticated', fn, 'EXECUTE'), format('%s not callable from browsers', fn);
    assert not has_function_privilege('anon', fn, 'EXECUTE'), format('%s not callable anonymously', fn);
  end loop;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
do $$
begin
  perform pg_temp.assert_rejected($q$select public.service_user_id_by_email('create-admin-a@example.invalid')$q$, '42501');
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3','Browser call',null)$q$, '42501');
end;
$$;

reset role;
set local role service_role;
do $$
begin
  -- Email lookup is case and space insensitive; unknown emails return null.
  assert public.service_user_id_by_email('  create-newcomer@EXAMPLE.invalid ') = '00000000-0000-0000-0000-0000000000a3', 'Lookup ignores case and spaces';
  assert public.service_user_id_by_email('nobody@example.invalid') is null, 'Unknown email returns null';

  -- An admin adds a resident to their own community.
  perform public.service_add_resident('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', '  Nova Veïna  ', '20000000-0000-0000-0000-0000000000a1');

  -- Rejections, each with its own error code for the Edge Function.
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a2','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3','Resident caller',null)$q$, '42501');
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a3','Other community',null)$q$, '42501');
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3','Twice',null)$q$, '23505');
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2','Wrong unit','20000000-0000-0000-0000-0000000000a2')$q$, '23505');
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3','   ',null)$q$, '23514');
end;
$$;

reset role;
-- A unit from another community is rejected even for a brand-new member.
delete from public.community_members where user_id = '00000000-0000-0000-0000-0000000000a3';
set local role service_role;
do $$
begin
  perform pg_temp.assert_rejected($q$select public.service_add_resident('00000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3','Foreign unit','20000000-0000-0000-0000-0000000000a2')$q$, '23503');
  perform public.service_add_resident('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', 'Nova Veïna', '20000000-0000-0000-0000-0000000000a1');
end;
$$;

reset role;
do $$
begin
  assert (select display_name = 'Nova Veïna' and role = 'resident' and unit_id = '20000000-0000-0000-0000-0000000000a1'
    from public.community_members where user_id = '00000000-0000-0000-0000-0000000000a3'), 'New member is a resident with a trimmed name';
  assert (select count(*) = 0 from public.community_members where community_id = '10000000-0000-0000-0000-0000000000a2'), 'Community B untouched';
  assert (select count(*) = 3 from public.community_members where community_id = '10000000-0000-0000-0000-0000000000a1'), 'Community A has exactly three members';
end;
$$;
select 'ok 1 - service-only resident creation: admin check, lookup, duplicates, foreign units, names, browser and anonymous denial';
rollback;
