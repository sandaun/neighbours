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

-- Hosted Storage blocks direct SQL deletes on its tables unless
-- storage.allow_delete_query is set. The Storage API sets it on every request and
-- then deletes as the caller, so RLS still decides. Emulate the API here so the
-- delete policies are what this test checks.
select set_config('storage.allow_delete_query', 'true', true);

-- Community A: 71, units A1 = 81, A2 = 82. Community B: 72, unit B1 = 83.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000071', 'files-admin-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000072', 'files-resident-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000073', 'files-admin-b@example.invalid');
insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-000000000071', 'Files A'),
  ('10000000-0000-0000-0000-000000000072', 'Files B');
insert into public.units (id, community_id, label) values
  ('20000000-0000-0000-0000-000000000081', '10000000-0000-0000-0000-000000000071', 'A1'),
  ('20000000-0000-0000-0000-000000000082', '10000000-0000-0000-0000-000000000071', 'A2'),
  ('20000000-0000-0000-0000-000000000083', '10000000-0000-0000-0000-000000000072', 'B1');
insert into public.community_members (community_id, user_id, unit_id, display_name, role) values
  ('10000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000071', null, 'Admin A', 'admin'),
  -- Admin A also lives in B (unit B1): it reads B's files but must not manage them.
  ('10000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000071', '20000000-0000-0000-0000-000000000083', 'Admin A at home', 'resident'),
  ('10000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000072', '20000000-0000-0000-0000-000000000081', 'Resident A1', 'resident'),
  ('10000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000073', null, 'Admin B', 'admin');
insert into public.documents (id, community_id, title, category, file_size_bytes, storage_path) values
  ('70000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000071', 'Rules A', 'rules', 100, '10000000-0000-0000-0000-000000000071/documents/rules.pdf'),
  ('70000000-0000-0000-0000-000000000072', '10000000-0000-0000-0000-000000000072', 'Rules B', 'rules', 100, '10000000-0000-0000-0000-000000000072/documents/rules.pdf');
insert into public.receipts (id, community_id, unit_id, concept, amount_cents, issued_at, period, status, storage_path) values
  ('80000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000071', '20000000-0000-0000-0000-000000000081', 'Fee A1', 100, '2026-10-01', 'October', 'paid', '10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000081/a1.pdf'),
  ('80000000-0000-0000-0000-000000000072', '10000000-0000-0000-0000-000000000072', '20000000-0000-0000-0000-000000000083', 'Fee B1', 300, '2026-10-01', 'October', 'paid', '10000000-0000-0000-0000-000000000072/receipts/20000000-0000-0000-0000-000000000083/b1.pdf');
insert into public.incidents (id, community_id, reporter_id, title, description, location, category, photo_path) values
  ('30000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000072', 'Damp wall', 'Damp on the storage room wall', 'Storage', 'other', '10000000-0000-0000-0000-000000000071/30000000-0000-0000-0000-000000000071/photo.jpg');
insert into storage.objects (bucket_id, name) values
  ('community-documents', '10000000-0000-0000-0000-000000000071/documents/rules.pdf'),
  ('community-documents', '10000000-0000-0000-0000-000000000072/documents/rules.pdf'),
  ('community-documents', '10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000081/a1.pdf'),
  ('community-documents', '10000000-0000-0000-0000-000000000072/receipts/20000000-0000-0000-0000-000000000083/b1.pdf'),
  ('community-documents', '10000000-0000-0000-0000-000000000071/documents/orphan-a.pdf'),
  ('community-documents', '10000000-0000-0000-0000-000000000072/documents/orphan-b.pdf'),
  ('incident-photos', '10000000-0000-0000-0000-000000000071/30000000-0000-0000-0000-000000000071/photo.jpg');

do $$
begin
  assert not has_column_privilege('authenticated', 'public.documents', 'community_id', 'UPDATE'), 'Document community is immutable';
  assert not has_column_privilege('authenticated', 'public.receipts', 'community_id', 'UPDATE'), 'Receipt community is immutable';
  assert not has_column_privilege('authenticated', 'public.receipts', 'unit_id', 'UPDATE'), 'Receipt unit is immutable';
  assert not has_table_privilege('anon', 'public.documents', 'INSERT,UPDATE,DELETE'), 'Anonymous has no document writes';
  assert not has_table_privilege('anon', 'public.receipts', 'INSERT,UPDATE,DELETE'), 'Anonymous has no receipt writes';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
do $$
begin
  -- Admin A reads B as a resident: the B rows and files used below are visible.
  assert (select count(*) = 1 from public.documents where id = '70000000-0000-0000-0000-000000000072'), 'Admin A reads B documents';
  assert (select count(*) = 1 from public.receipts where id = '80000000-0000-0000-0000-000000000072'), 'Admin A reads own B1 receipt';
  assert (select count(*) = 1 from storage.objects where name = '10000000-0000-0000-0000-000000000072/documents/rules.pdf'), 'Admin A reads B shared PDF';
  -- Admins see every file of their own community, including unattached uploads.
  assert (select count(*) = 1 from storage.objects where name like '%/orphan-a.pdf'), 'Admin sees own orphan upload';
  assert (select count(*) = 0 from storage.objects where name like '%/orphan-b.pdf'), 'Admin does not see other orphan uploads';
  assert (select count(*) = 1 from storage.objects where bucket_id = 'incident-photos'), 'Admin sees the incident photo';

  -- Storage uploads: only the admin's own namespaces.
  perform pg_temp.assert_one_row($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/documents/minutes-2026.pdf')$q$);
  perform pg_temp.assert_one_row($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000082/nov.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000072/documents/forged.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000083/forged.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-0000000000ff/forged.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/documents/../../10000000-0000-0000-0000-000000000072/documents/x.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/documents/script.html')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/loose.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('incident-photos','10000000-0000-0000-0000-000000000071/30000000-0000-0000-0000-000000000071/photo.png')$q$);

  -- Storage deletes: own community only; never incident photos; never renames.
  perform pg_temp.assert_one_row($q$delete from storage.objects where name = '10000000-0000-0000-0000-000000000071/documents/orphan-a.pdf'$q$);
  perform pg_temp.assert_no_mutation($q$delete from storage.objects where name = '10000000-0000-0000-0000-000000000072/documents/rules.pdf'$q$);
  perform pg_temp.assert_no_mutation($q$delete from storage.objects where bucket_id = 'incident-photos'$q$);
  perform pg_temp.assert_no_mutation($q$update storage.objects set name = '10000000-0000-0000-0000-000000000071/documents/renamed.pdf' where name = '10000000-0000-0000-0000-000000000071/documents/rules.pdf'$q$);

  -- Documents.
  perform pg_temp.assert_one_row($q$insert into public.documents(community_id,title,category,file_size_bytes,storage_path) values ('10000000-0000-0000-0000-000000000071','Minutes 2026','minutes',2048,'10000000-0000-0000-0000-000000000071/documents/minutes-2026.pdf')$q$);
  perform pg_temp.assert_one_row($q$update public.documents set title = 'Rules A (2026)', updated_at = now() where id = '70000000-0000-0000-0000-000000000071'$q$);
  perform pg_temp.assert_denied($q$insert into public.documents(community_id,title,category,file_size_bytes) values ('10000000-0000-0000-0000-000000000072','Cross','rules',0)$q$);
  perform pg_temp.assert_denied($q$insert into public.documents(community_id,title,category,file_size_bytes,storage_path) values ('10000000-0000-0000-0000-000000000071','Receipt as document','rules',1,'10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000081/a1.pdf')$q$);
  perform pg_temp.assert_denied($q$update public.documents set community_id = '10000000-0000-0000-0000-000000000072' where id = '70000000-0000-0000-0000-000000000071'$q$);
  perform pg_temp.assert_no_mutation($q$update public.documents set title = 'Forged' where id = '70000000-0000-0000-0000-000000000072'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.documents where id = '70000000-0000-0000-0000-000000000072'$q$);

  -- Receipts.
  perform pg_temp.assert_one_row($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status,storage_path) values ('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000082','Fee A2',12550,'2026-11-01','November 2026','scheduled','10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000082/nov.pdf')$q$);
  perform pg_temp.assert_one_row($q$update public.receipts set status = 'paid', amount_cents = 120 where id = '80000000-0000-0000-0000-000000000071'$q$);
  perform pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status) values ('10000000-0000-0000-0000-000000000072','20000000-0000-0000-0000-000000000083','Cross',1,'2026-11-01','November','paid')$q$);
  perform pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status) values ('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000083','Foreign unit',1,'2026-11-01','November','paid')$q$);
  perform pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status) values ('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000081','Negative',-1,'2026-11-01','November','paid')$q$);
  perform pg_temp.assert_denied($q$update public.receipts set unit_id = '20000000-0000-0000-0000-000000000082' where id = '80000000-0000-0000-0000-000000000071'$q$);
  perform pg_temp.assert_denied($q$update public.receipts set storage_path = '10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000082/nov.pdf' where id = '80000000-0000-0000-0000-000000000071'$q$);
  perform pg_temp.assert_no_mutation($q$update public.receipts set amount_cents = 1 where id = '80000000-0000-0000-0000-000000000072'$q$);
  perform pg_temp.assert_no_mutation($q$delete from public.receipts where id = '80000000-0000-0000-0000-000000000072'$q$);
end;
$$;

-- Residents keep read-only access.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000072', true);
do $$
begin
  assert (select count(*) = 0 from storage.objects where name like '%/nov.pdf'), 'Resident A1 cannot read the A2 receipt';
  assert (select count(*) = 1 from storage.objects where name like '%/minutes-2026.pdf'), 'Resident reads the newly published document';
  assert (select count(*) = 0 from storage.objects where name like '%/orphan-a.pdf'), 'Resident cannot read unattached uploads';
  perform pg_temp.assert_denied($q$insert into public.documents(community_id,title,category,file_size_bytes) values ('10000000-0000-0000-0000-000000000071','Resident doc','rules',0)$q$);
  perform pg_temp.assert_denied($q$insert into public.receipts(community_id,unit_id,concept,amount_cents,issued_at,period,status) values ('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000081','Resident receipt',1,'2026-11-01','November','paid')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/documents/resident.pdf')$q$);
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/receipts/20000000-0000-0000-0000-000000000081/resident.pdf')$q$);
  perform pg_temp.assert_no_mutation('update public.documents set title = ''Forged''');
  perform pg_temp.assert_no_mutation('delete from public.documents');
  perform pg_temp.assert_no_mutation('update public.receipts set amount_cents = 0');
  perform pg_temp.assert_no_mutation('delete from public.receipts');
  perform pg_temp.assert_no_mutation('delete from storage.objects');
end;
$$;

-- Revoking the admin role is effective immediately.
reset role;
update public.community_members set role = 'resident'
where user_id = '00000000-0000-0000-0000-000000000071' and community_id = '10000000-0000-0000-0000-000000000071';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
do $$
begin
  perform pg_temp.assert_denied($q$insert into storage.objects(bucket_id,name) values ('community-documents','10000000-0000-0000-0000-000000000071/documents/after-revocation.pdf')$q$);
  perform pg_temp.assert_no_mutation('delete from storage.objects');
  perform pg_temp.assert_no_mutation('delete from public.documents');
end;
$$;

reset role;
set local role anon;
do $$
begin
  perform pg_temp.assert_denied($q$insert into public.documents(community_id,title,category,file_size_bytes) values ('10000000-0000-0000-0000-000000000071','Anonymous','rules',0)$q$);
  perform pg_temp.assert_no_mutation('delete from storage.objects');
end;
$$;

reset role;
do $$
begin
  assert (select count(*) = 3 from storage.objects where name like '10000000-0000-0000-0000-000000000072/%'), 'Community B files untouched (rules, receipt, orphan)';
  assert (select count(*) = 1 from storage.objects where bucket_id = 'incident-photos' and name = '10000000-0000-0000-0000-000000000071/30000000-0000-0000-0000-000000000071/photo.jpg'), 'Incident photo untouched';
  assert (select count(*) = 1 from storage.objects where name like '%/documents/rules.pdf' and name like '10000000-0000-0000-0000-000000000071/%'), 'Community A file not renamed';
  assert (select title = 'Rules B' from public.documents where id = '70000000-0000-0000-0000-000000000072'), 'Community B document untouched';
  assert (select amount_cents = 300 from public.receipts where id = '80000000-0000-0000-0000-000000000072'), 'Community B receipt untouched';
  assert (select amount_cents = 120 and status = 'paid' from public.receipts where id = '80000000-0000-0000-0000-000000000071'), 'Admin receipt edit kept';
end;
$$;
select 'ok 1 - admin documents/receipts and PDF namespaces, isolation, immutable ownership, residents, revocation, anonymous';
rollback;
