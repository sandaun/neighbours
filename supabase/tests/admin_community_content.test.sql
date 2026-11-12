-- Transactional TAP test: supabase test db. All fixtures roll back.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

create function pg_temp.assert_denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation then
    return;
  end;
  raise exception 'Expected denied operation: %', statement;
end;
$$;

-- UPDATE/DELETE rows outside every matching policy are skipped, not rejected.
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

create function pg_temp.assert_one_row(statement text) returns void language plpgsql as $$
declare
  affected_rows bigint;
begin
  execute statement;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Expected one affected row, got %: %', affected_rows, statement;
  end if;
end;
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000031', 'content-admin-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000032', 'content-resident-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000033', 'content-admin-b@example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-000000000031', 'Content admin A'),
  ('10000000-0000-0000-0000-000000000032', 'Content admin B');
insert into public.community_members (community_id, user_id, display_name, role) values
  ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000031', 'Admin A', 'admin'),
  ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000032', 'Resident A', 'resident'),
  ('10000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000033', 'Admin B', 'admin'),
  -- Admin A also lives in community B as a resident: it reads B, but must not manage it.
  ('10000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000031', 'Admin A at home', 'resident');
insert into public.community_events (id, community_id, title, location, starts_at) values
  ('40000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 'Meeting A', 'Hall', '2026-12-01T18:00:00Z'),
  ('40000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000032', 'Meeting B', 'Hall', '2026-12-01T18:00:00Z');
insert into public.board_posts (id, community_id, title, body, author_name, topic, published_at) values
  ('50000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 'Published A', 'Notice A', 'Admin A', 'Parking', now() - interval '1 day'),
  ('50000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000031', 'Scheduled A', 'Later A', 'Admin A', 'Parking', now() + interval '1 day'),
  ('50000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000032', 'Scheduled B', 'Later B', 'Admin B', 'Parking', now() + interval '1 day'),
  ('50000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000032', 'Published B', 'Notice B', 'Admin B', 'Parking', now() - interval '1 day');
insert into public.directory_contacts (id, community_id, name, service) values
  ('60000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 'Plumber A', 'Plumbing'),
  ('60000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000032', 'Plumber B', 'Plumbing');

-- Grants: ids and communities are never client-writable.
do $$
begin
  assert not has_column_privilege('authenticated', 'public.community_events', 'community_id', 'UPDATE'), 'Event community is immutable';
  assert not has_column_privilege('authenticated', 'public.board_posts', 'community_id', 'UPDATE'), 'Post community is immutable';
  assert not has_column_privilege('authenticated', 'public.directory_contacts', 'community_id', 'UPDATE'), 'Contact community is immutable';
  assert not has_column_privilege('authenticated', 'public.community_events', 'id', 'INSERT'), 'Event id is server generated';
  assert not has_table_privilege('anon', 'public.community_events', 'INSERT,UPDATE,DELETE'), 'Anonymous has no event writes';
  assert not has_table_privilege('anon', 'public.board_posts', 'INSERT,UPDATE,DELETE'), 'Anonymous has no post writes';
  assert not has_table_privilege('anon', 'public.directory_contacts', 'INSERT,UPDATE,DELETE'), 'Anonymous has no contact writes';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
do $$
begin
  assert (select count(*) = 1 from public.community_events where id = '40000000-0000-0000-0000-000000000032'), 'Admin A reads B as a resident';
  assert (select count(*) = 1 from public.directory_contacts where id = '60000000-0000-0000-0000-000000000032'), 'Admin A reads B contacts as a resident';
  -- Calendar.
  perform pg_temp.assert_one_row($q$insert into public.community_events(community_id,title,location,starts_at,ends_at) values ('10000000-0000-0000-0000-000000000031','Garden day','Garden','2026-12-05T09:00:00Z','2026-12-05T12:00:00Z')$q$);
  perform pg_temp.assert_one_row($q$update public.community_events set title = 'Annual meeting A' where id = '40000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_denied($q$insert into public.community_events(community_id,title,location,starts_at) values ('10000000-0000-0000-0000-000000000032','Cross community','Hall','2026-12-05T09:00:00Z')$q$);
  perform pg_temp.assert_denied($q$update public.community_events set community_id = '10000000-0000-0000-0000-000000000032' where id = '40000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_denied($q$insert into public.community_events(community_id,title,location,starts_at,ends_at) values ('10000000-0000-0000-0000-000000000031','Backwards','Hall','2026-12-05T09:00:00Z','2026-12-05T08:00:00Z')$q$);
  perform pg_temp.assert_no_mutation($q$update public.community_events set title = 'Forged' where id = '40000000-0000-0000-0000-000000000032'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.community_events where id = '40000000-0000-0000-0000-000000000032'$q$);

  -- Board: admins see their own community's scheduled posts.
  assert (select count(*) = 3 from public.board_posts), 'Admin A sees A posts and B published posts, not B scheduled posts';
  perform pg_temp.assert_one_row($q$insert into public.board_posts(community_id,title,body,author_name,topic,published_at) values ('10000000-0000-0000-0000-000000000031','Water cut','Water is cut on Monday','Admin A','Avís',now() + interval '2 days')$q$);
  assert (select count(*) = 4 from public.board_posts), 'Admin A reads back the scheduled post';
  perform pg_temp.assert_one_row($q$update public.board_posts set body = 'Updated notice' where id = '50000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_denied($q$insert into public.board_posts(community_id,title,body,author_name,topic) values ('10000000-0000-0000-0000-000000000032','Cross','Cross community','Admin A','Avís')$q$);
  perform pg_temp.assert_denied($q$insert into public.board_posts(community_id,title,body,author_name,topic) values ('10000000-0000-0000-0000-000000000031','  ','Blank title','Admin A','Avís')$q$);
  perform pg_temp.assert_denied($q$update public.board_posts set community_id = '10000000-0000-0000-0000-000000000032' where id = '50000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_no_mutation($q$update public.board_posts set body = 'Forged' where id = '50000000-0000-0000-0000-000000000033'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.board_posts where id = '50000000-0000-0000-0000-000000000033'$q$);
  -- Visible to Admin A as a resident of B, still not manageable.
  perform pg_temp.assert_no_mutation($q$update public.board_posts set body = 'Forged' where id = '50000000-0000-0000-0000-000000000034'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.board_posts where id = '50000000-0000-0000-0000-000000000034'$q$);
  perform pg_temp.assert_one_row($q$delete from public.board_posts where id = '50000000-0000-0000-0000-000000000032'$q$);

  -- Directory.
  perform pg_temp.assert_one_row($q$insert into public.directory_contacts(community_id,name,service,phone,sort_order) values ('10000000-0000-0000-0000-000000000031','Electrician A','Electricity','600000000',2)$q$);
  perform pg_temp.assert_one_row($q$update public.directory_contacts set hours = 'Mon-Fri 9-18' where id = '60000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_denied($q$insert into public.directory_contacts(community_id,name,service,phone) values ('10000000-0000-0000-0000-000000000031','Empty phone','Service','')$q$);
  perform pg_temp.assert_denied($q$insert into public.directory_contacts(community_id,name,service) values ('10000000-0000-0000-0000-000000000032','Cross','Service')$q$);
  perform pg_temp.assert_denied($q$update public.directory_contacts set community_id = '10000000-0000-0000-0000-000000000032' where id = '60000000-0000-0000-0000-000000000031'$q$);
  perform pg_temp.assert_no_mutation($q$update public.directory_contacts set name = 'Forged' where id = '60000000-0000-0000-0000-000000000032'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.directory_contacts where id = '60000000-0000-0000-0000-000000000032'$q$);
  perform pg_temp.assert_one_row($q$delete from public.directory_contacts where id = '60000000-0000-0000-0000-000000000031'$q$);
end;
$$;

-- Residents keep read-only access to the same rows.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000032', true);
do $$
begin
  assert (select count(*) = 1 and min(title) = 'Published A' from public.board_posts), 'Resident sees only published posts';
  perform pg_temp.assert_denied($q$insert into public.community_events(community_id,title,location,starts_at) values ('10000000-0000-0000-0000-000000000031','Resident event','Hall','2026-12-05T09:00:00Z')$q$);
  perform pg_temp.assert_denied($q$insert into public.board_posts(community_id,title,body,author_name,topic) values ('10000000-0000-0000-0000-000000000031','Resident post','Body','Resident A','Avís')$q$);
  perform pg_temp.assert_denied($q$insert into public.directory_contacts(community_id,name,service) values ('10000000-0000-0000-0000-000000000031','Resident contact','Service')$q$);
  perform pg_temp.assert_no_mutation('update public.community_events set title = ''Forged''');
  perform pg_temp.assert_no_mutation('update public.board_posts set body = ''Forged''');
  perform pg_temp.assert_no_mutation('update public.directory_contacts set name = ''Forged''');
  perform pg_temp.assert_no_mutation('delete from public.community_events');
  perform pg_temp.assert_no_mutation('delete from public.board_posts');
  perform pg_temp.assert_no_mutation('delete from public.directory_contacts');
end;
$$;

-- Revoking the admin role is effective immediately.
reset role;
update public.community_members set role = 'resident' where user_id = '00000000-0000-0000-0000-000000000031';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
do $$
begin
  assert (select count(*) = 2 from public.board_posts), 'Former admin sees only published A and B posts';
  perform pg_temp.assert_denied($q$insert into public.community_events(community_id,title,location,starts_at) values ('10000000-0000-0000-0000-000000000031','Former admin','Hall','2026-12-05T09:00:00Z')$q$);
  perform pg_temp.assert_no_mutation('delete from public.community_events');
end;
$$;

reset role;
set local role anon;
do $$
begin
  perform pg_temp.assert_denied($q$insert into public.community_events(community_id,title,location,starts_at) values ('10000000-0000-0000-0000-000000000031','Anonymous','Hall','2026-12-05T09:00:00Z')$q$);
  perform pg_temp.assert_denied('delete from public.board_posts');
end;
$$;

reset role;
do $$
begin
  -- Only the admin's own-community changes happened.
  assert (select title = 'Meeting B' from public.community_events where id = '40000000-0000-0000-0000-000000000032'), 'Community B event untouched';
  assert (select count(*) = 2 from public.community_events where community_id = '10000000-0000-0000-0000-000000000031'), 'Community A has two events';
  assert (select body = 'Updated notice' from public.board_posts where id = '50000000-0000-0000-0000-000000000031'), 'Admin post edit kept';
  assert (select body = 'Later B' from public.board_posts where id = '50000000-0000-0000-0000-000000000033'), 'Community B scheduled post untouched';
  assert (select body = 'Notice B' from public.board_posts where id = '50000000-0000-0000-0000-000000000034'), 'Community B published post untouched';
  assert (select count(*) = 1 from public.directory_contacts where community_id = '10000000-0000-0000-0000-000000000032'), 'Community B contact untouched';
end;
$$;
select 'ok 1 - admin calendar/board/directory writes, isolation, immutable community, residents, revocation, anonymous';
rollback;
