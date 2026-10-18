-- Transactional TAP test: supabase test db. All fixtures roll back.
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

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'resident-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'resident-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000003', 'resident-c@example.invalid'),
  ('00000000-0000-0000-0000-000000000004', 'admin-a@example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Community A'),
  ('10000000-0000-0000-0000-000000000002', 'Community B');
insert into public.units (id, community_id, label) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'B1'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'A2');
insert into public.community_members (community_id, user_id, unit_id, display_name, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Resident A', 'resident'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Resident B', 'resident'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Resident C', 'resident'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', null, 'Admin A', 'admin');
select pg_temp.assert_denied($q$insert into public.community_members (community_id,user_id,unit_id,display_name) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Wrong unit')$q$);
insert into public.incidents (id,community_id,reporter_id,title,description,location,category,photo_path) values
  ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Broken light','The entrance light is broken','Entrance','electrical','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/photo.jpg'),
  ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Water leak','The garage pipe is leaking','Garage','plumbing',null),
  ('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Stuck door','The shared entrance door is stuck','Entrance','other',null);
insert into public.incident_updates (incident_id,body,author_name) values
  ('30000000-0000-0000-0000-000000000001','An electrician has been contacted','Administration'),
  ('30000000-0000-0000-0000-000000000002','A plumber has been contacted','Administration');
insert into public.documents (community_id,title,category,file_size_bytes,storage_path) values
  ('10000000-0000-0000-0000-000000000001','Rules A','rules',100,'10000000-0000-0000-0000-000000000001/documents/rules.pdf'),
  ('10000000-0000-0000-0000-000000000002','Rules B','rules',100,'10000000-0000-0000-0000-000000000002/documents/rules.pdf');
insert into public.receipts (community_id,unit_id,concept,amount_cents,issued_at,period,status,storage_path) values
  ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Fee A1',100,'2026-10-01','October','paid','10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000001/a1.pdf'),
  ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','Fee A2',200,'2026-10-01','October','paid','10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000003/a2.pdf'),
  ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Fee B1',300,'2026-10-01','October','paid','10000000-0000-0000-0000-000000000002/receipts/20000000-0000-0000-0000-000000000002/b1.pdf');
insert into public.community_events (community_id,title,location,starts_at) values
  ('10000000-0000-0000-0000-000000000001','Meeting A','Hall','2026-10-22T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000002','Meeting B','Hall','2026-10-22T10:00:00Z');
-- Disjoint PDF namespaces prevent accidentally publishing a private receipt as a document.
select pg_temp.assert_denied($q$insert into public.documents(community_id,title,category,file_size_bytes,storage_path) values ('10000000-0000-0000-0000-000000000001','Wrong namespace','rules',1,'10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000001/private.pdf')$q$);
select pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status,storage_path) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Wrong unit path',1,'2026-10-01','October','paid','10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000003/private.pdf')$q$);
select pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status) values ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Cross community unit',1,'2026-10-01','October','paid')$q$);
insert into storage.objects (bucket_id,name) values
  ('incident-photos','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/photo.jpg'),
  ('community-documents','10000000-0000-0000-0000-000000000001/documents/rules.pdf'),
  ('community-documents','10000000-0000-0000-0000-000000000002/documents/rules.pdf'),
  ('community-documents','10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000001/a1.pdf'),
  ('community-documents','10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000003/a2.pdf'),
  ('community-documents','10000000-0000-0000-0000-000000000002/receipts/20000000-0000-0000-0000-000000000002/b1.pdf'),
  ('community-documents','10000000-0000-0000-0000-000000000001/orphan.pdf');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$
begin
  assert (select count(*) = 1 from public.communities), 'Resident reads own community';
  assert (select count(*) = 1 from public.community_members), 'Membership does not recurse or expose neighbours';
  assert (select count(*) = 1 from public.units), 'Resident reads only own unit';
  assert (select count(*) = 2 from public.incidents), 'Community incidents are shared';
  assert (select count(*) = 1 from public.incident_updates), 'Updates obey parent community';
  assert (select count(*) = 1 from public.documents), 'Documents stay in community';
  assert (select count(*) = 1 from public.community_events), 'Events stay in community';
  assert (select count(*) = 1 and min(amount_cents) = 100 from public.receipts), 'Receipts stay in own unit';
  assert (select count(*) = 3 from storage.objects), 'Only attached photo, shared PDF, own receipt are visible';
  perform pg_temp.assert_denied('update public.community_members set role = ''admin''');
  perform pg_temp.assert_denied('delete from public.community_members');
  perform pg_temp.assert_denied('insert into public.communities(name) values (''Forged community'')');
  perform pg_temp.assert_denied('update public.units set balance_cents = 999');
  perform pg_temp.assert_denied('update public.incidents set status = ''resolved''');
  perform pg_temp.assert_denied('update public.incidents set reporter_id = ''00000000-0000-0000-0000-000000000003''');
  perform pg_temp.assert_denied('update public.incidents set community_id = ''10000000-0000-0000-0000-000000000002''');
  perform pg_temp.assert_denied('update public.receipts set unit_id = ''20000000-0000-0000-0000-000000000003''');
  perform pg_temp.assert_denied('update public.documents set storage_path = ''10000000-0000-0000-0000-000000000001/receipts/20000000-0000-0000-0000-000000000003/a2.pdf''');
  perform pg_temp.assert_denied('delete from public.incidents');
  perform pg_temp.assert_denied($q$insert into public.incident_updates(incident_id,body,author_name) values ('30000000-0000-0000-0000-000000000001','Forged update','Admin')$q$);
  perform pg_temp.assert_denied($q$insert into public.incidents(community_id,reporter_id,title,description,location,category) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Cross community','This is malicious input','Hall','other')$q$);
  perform pg_temp.assert_denied($q$insert into public.incidents(community_id,reporter_id,title,description,location,category) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Other reporter','This is malicious input','Hall','other')$q$);
  perform pg_temp.assert_denied($q$insert into public.incidents(community_id,reporter_id,title,description,location,category,status) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Spoofed status','This is malicious input','Hall','other','resolved')$q$);
  perform pg_temp.assert_denied($q$insert into public.incidents(community_id,reporter_id,title,description,location,category,reported_at) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Spoofed date','This is malicious input','Hall','other','2020-01-01')$q$);
  perform pg_temp.assert_denied($q$update public.incidents set photo_path = '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/photo.jpg' where id = '30000000-0000-0000-0000-000000000001'$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('incident-photos','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/forged.jpg')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('incident-photos','10000000-0000-0000-0000-000000000002/30000000-0000-0000-0000-000000000002/forged.jpg')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000001/forged.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('incident-photos','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/../forged.jpg')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('incident-photos','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/arbitrary-name.jpg')$q$);
  perform pg_temp.assert_denied('update storage.objects set name = ''reassigned''');
end;
$$;
-- Allowed write, followed by photo upload and column-limited attach.
insert into public.incidents (community_id,reporter_id,title,description,location,category)
values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','New incident','The entrance light is flickering','Hall','electrical');
insert into storage.objects (bucket_id,name) values
  ('incident-photos','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/photo.png');
update public.incidents set photo_path = '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/photo.png'
where id = '30000000-0000-0000-0000-000000000001';
do $$
begin
  assert (select count(*) = 3 from public.incidents), 'Resident can create incident';
  assert (select count(*) = 1 from storage.objects where name like '%/photo.png'), 'Attached upload is readable';
  update public.incidents set photo_path = null where id = '30000000-0000-0000-0000-000000000003';
  assert not found, 'Cannot edit another resident photo';
end;
$$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$
begin
  assert (select count(*) = 1 and min(name) = 'Community B' from public.communities), 'Second user reads only community B';
  assert (select count(*) = 1 from public.incidents), 'Second user cannot see community A incident';
  assert (select count(*) = 1 and min(amount_cents) = 300 from public.receipts), 'Second user reads own receipts';
  assert (select count(*) = 2 from storage.objects), 'Second user reads only community B files';
end;
$$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
do $$
begin
  assert (select count(*) = 2 from public.units), 'Community admin reads community units';
  assert (select count(*) = 2 from public.receipts), 'Community admin reads receipts only in managed community';
  perform pg_temp.assert_denied('update public.incidents set status = ''resolved''');
end;
$$;

-- Membership revocation is effective immediately, even for a still-valid JWT subject.
reset role;
delete from public.community_members where user_id = '00000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$
begin
  assert (select count(*) = 0 from public.communities), 'Revoked member loses database access';
  assert (select count(*) = 0 from storage.objects), 'Revoked member loses new file access';
  perform pg_temp.assert_denied($q$insert into public.incidents(community_id,reporter_id,title,description,location,category) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Revoked user','This is malicious input','Hall','other')$q$);
end;
$$;

reset role;
set local role anon;
do $$
begin
  perform pg_temp.assert_denied('select * from public.communities');
  perform pg_temp.assert_denied('select * from public.receipts');
  perform pg_temp.assert_denied('insert into public.communities(name) values (''Anonymous'')');
end;
$$;
reset role;
select 'ok 1 - resident allow/deny, community/unit isolation, photos, admin, revocation, anonymous';
rollback;
