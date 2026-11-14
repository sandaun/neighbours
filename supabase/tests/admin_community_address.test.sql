-- The transaction also serves as a pre-deployment check when the migration
-- is run in the same transaction before these assertions.
begin;
set local plpgsql.check_asserts = on;
select '1..1';

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'address-admin@example.invalid'),
  ('00000000-0000-0000-0000-0000000000b2', 'address-resident@example.invalid');

insert into public.communities (id, name) values
  ('10000000-0000-0000-0000-0000000000b1', 'Address test A'),
  ('10000000-0000-0000-0000-0000000000b2', 'Address test B');

insert into public.community_members (community_id, user_id, display_name, role) values
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'Test admin', 'admin'),
  ('10000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', 'Test member', 'resident'),
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', 'Test resident', 'resident');

do $$
begin
  assert has_column_privilege('authenticated', 'public.communities', 'address_line', 'UPDATE');
  assert has_column_privilege('authenticated', 'public.communities', 'municipality', 'UPDATE');
  assert has_column_privilege('authenticated', 'public.communities', 'name', 'UPDATE');
  assert not has_column_privilege('authenticated', 'public.communities', 'id', 'UPDATE');
  assert not has_column_privilege('authenticated', 'public.communities', 'created_at', 'UPDATE');
  assert not has_column_privilege('anon', 'public.communities', 'address_line', 'UPDATE');
  assert not has_column_privilege('anon', 'public.communities', 'name', 'UPDATE');
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
declare
  saved_name text;
  saved_street text;
  saved_municipality text;
begin
  update public.communities
     set name = 'Renamed test A', address_line = 'Test Street 14', municipality = 'Test Town'
   where id = '10000000-0000-0000-0000-0000000000b1'
  returning name, address_line, municipality into saved_name, saved_street, saved_municipality;
  assert found and saved_name = 'Renamed test A'
    and saved_street = 'Test Street 14' and saved_municipality = 'Test Town',
    'An administrator can update and read back their community details';

  update public.communities set address_line = null
   where id = '10000000-0000-0000-0000-0000000000b1';
  assert found, 'An administrator can clear the optional street address';

  update public.communities set name = 'Other name', municipality = 'Other Town'
   where id = '10000000-0000-0000-0000-0000000000b2';
  assert not found, 'Administration of one community does not allow editing another';
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);

do $$
begin
  update public.communities set name = 'Other name', address_line = 'Other address'
   where id = '10000000-0000-0000-0000-0000000000b1';
  assert not found, 'A resident cannot update their community details';
  assert (select name = 'Renamed test A' and address_line is null and municipality = 'Test Town'
    from public.communities where id = '10000000-0000-0000-0000-0000000000b1'),
    'A resident can read the saved address';
end;
$$;

select 'ok 1 - community details update is limited to its administrators';
rollback;
