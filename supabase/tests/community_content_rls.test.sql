-- Transactional TAP test. All content, memberships, and Auth fixtures roll back.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

insert into auth.users (id,email) values
  ('00000000-0000-0000-0000-000000000011','content-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000012','content-b@example.invalid');
insert into public.communities (id,name) values
  ('10000000-0000-0000-0000-000000000011','Content A'),
  ('10000000-0000-0000-0000-000000000012','Content B');
insert into public.community_members (community_id,user_id,display_name) values
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011','Member A'),
  ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000012','Member B');
insert into public.board_posts (community_id,title,body,author_name,topic,published_at) values
  ('10000000-0000-0000-0000-000000000011','Published A','Notice A','Operator','Maintenance',now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000011','Future A','Not published','Operator','Maintenance',now() + interval '1 day'),
  ('10000000-0000-0000-0000-000000000012','Published B','Notice B','Operator','Maintenance',now() - interval '1 day');
insert into public.directory_contacts (community_id,name,service) values
  ('10000000-0000-0000-0000-000000000011','Contact A','Maintenance'),
  ('10000000-0000-0000-0000-000000000012','Contact B','Cleaning');

insert into public.documents (community_id,title,category,file_size_bytes) values
  ('10000000-0000-0000-0000-000000000011','Unattached rules','rules',0);

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
do $$
begin
  assert (select count(*) = 1 and bool_and(storage_path is null) from public.documents), 'Unattached metadata is readable';
  assert (select count(*) = 1 and min(title) = 'Published A' from public.board_posts), 'Only published posts in own community';
  assert (select count(*) = 1 and min(name) = 'Contact A' from public.directory_contacts), 'Only own community contacts';
  assert not has_table_privilege('authenticated','public.board_posts','INSERT,UPDATE,DELETE'), 'Posts are client read only';
  assert not has_table_privilege('authenticated','public.directory_contacts','INSERT,UPDATE,DELETE'), 'Contacts are client read only';
  begin
    update public.board_posts set body = 'Forged notice';
    raise exception 'Client post writes must fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.directory_contacts(community_id,name,service)
    values ('10000000-0000-0000-0000-000000000011','Forged contact','Forged service');
    raise exception 'Client contact creation must fail';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
do $$ begin
  assert (select count(*) = 1 and min(title) = 'Published B' from public.board_posts), 'Cross-community posts isolated';
  assert (select count(*) = 1 and min(name) = 'Contact B' from public.directory_contacts), 'Cross-community contacts isolated';
end; $$;
reset role;
delete from public.community_members where user_id = '00000000-0000-0000-0000-000000000012';
set local role authenticated;
do $$ begin
  assert (select count(*) = 0 from public.board_posts), 'Revocation removes post access';
  assert (select count(*) = 0 from public.directory_contacts), 'Revocation removes directory access';
end; $$;
reset role;
set local role anon;
do $$ begin
  assert not has_table_privilege('anon','public.board_posts','SELECT'), 'Anonymous cannot read posts';
  assert not has_table_privilege('anon','public.directory_contacts','SELECT'), 'Anonymous cannot read contacts';
end; $$;
reset role;
select 'ok 1 - content isolation, scheduled posts, read-only grants, revocation, anonymous';
rollback;
