-- Resident MVP. Administrative changes are made through the dashboard/service role.
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  label text not null,
  balance_cents integer not null default 0,
  next_charge_at date,
  next_charge_cents integer check (next_charge_cents >= 0),
  created_at timestamptz not null default now(),
  unique (community_id, id),
  check ((next_charge_at is null) = (next_charge_cents is null))
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid,
  display_name text not null,
  role text not null default 'resident' check (role in ('resident', 'admin')),
  created_at timestamptz not null default now(),
  primary key (community_id, user_id),
  foreign key (community_id, unit_id) references public.units(community_id, id)
);
create index community_members_user_idx on public.community_members(user_id, created_at, community_id);
create index community_members_unit_idx on public.community_members(community_id, unit_id);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  reporter_id uuid not null references auth.users(id),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 4000),
  location text not null check (char_length(btrim(location)) between 2 and 160),
  category text not null check (category in ('plumbing', 'electrical', 'elevator', 'other')),
  status text not null default 'received' check (status in ('received', 'in-progress', 'resolved')),
  photo_path text,
  reported_at timestamptz not null default now(),
  check (photo_path is null or photo_path ~ ('^' || community_id::text || '/' || id::text || '/photo\.(jpg|png|webp)$'))
);
create index incidents_community_idx on public.incidents(community_id, reported_at desc);
create index incidents_reporter_idx on public.incidents(reporter_id);

create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  author_name text not null,
  status text check (status in ('received', 'in-progress', 'resolved')),
  created_at timestamptz not null default now()
);
create index incident_updates_incident_idx on public.incident_updates(incident_id, created_at);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  category text not null check (category in ('minutes', 'insurance', 'rules')),
  file_size_bytes integer not null check (file_size_bytes >= 0),
  storage_path text not null unique,
  updated_at timestamptz not null default now(),
  check (storage_path ~ ('^' || community_id::text || '/documents/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$'))
);
create index documents_community_idx on public.documents(community_id, updated_at desc);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  unit_id uuid not null,
  concept text not null,
  amount_cents integer not null check (amount_cents >= 0),
  issued_at date not null,
  period text not null,
  status text not null check (status in ('paid', 'scheduled')),
  storage_path text unique,
  foreign key (community_id, unit_id) references public.units(community_id, id),
  check (storage_path is null or (storage_path ~ ('^' || community_id::text || '/receipts/' || unit_id::text || '/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$')))
);
create index receipts_unit_idx on public.receipts(community_id, unit_id, issued_at desc);

create table public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  location text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);
create index community_events_community_idx on public.community_events(community_id, starts_at);

alter table public.communities enable row level security;
alter table public.units enable row level security;
alter table public.community_members enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_updates enable row level security;
alter table public.documents enable row level security;
alter table public.receipts enable row level security;
alter table public.community_events enable row level security;

revoke all on public.communities, public.units, public.community_members,
  public.incidents, public.incident_updates, public.documents, public.receipts,
  public.community_events from anon, authenticated;
grant select on public.communities, public.units, public.community_members,
  public.incidents, public.incident_updates, public.documents, public.receipts,
  public.community_events to authenticated;
grant all on public.communities, public.units, public.community_members,
  public.incidents, public.incident_updates, public.documents, public.receipts,
  public.community_events to service_role;
grant insert (community_id, reporter_id, title, description, location, category)
  on public.incidents to authenticated;
grant update (photo_path) on public.incidents to authenticated;

-- Membership only reads itself: no recursive policy or privileged helper is needed.
create policy members_read_self on public.community_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy communities_read_member on public.communities for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = communities.id and m.user_id = (select auth.uid())));

create policy units_read_owner on public.units for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = units.community_id and m.user_id = (select auth.uid()) and (m.unit_id = units.id or m.role = 'admin')));

create policy incidents_read_member on public.incidents for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = incidents.community_id and m.user_id = (select auth.uid())));
create policy incidents_create_member on public.incidents for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'received' and photo_path is null
    and exists (select 1 from public.community_members m where m.community_id = incidents.community_id and m.user_id = (select auth.uid())));
create policy incidents_attach_own_photo on public.incidents for update to authenticated
  using (reporter_id = (select auth.uid()) and exists (select 1 from public.community_members m where m.community_id = incidents.community_id and m.user_id = (select auth.uid())))
  with check (reporter_id = (select auth.uid()) and exists (select 1 from public.community_members m where m.community_id = incidents.community_id and m.user_id = (select auth.uid())));

create policy updates_read_member on public.incident_updates for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_updates.incident_id));
create policy documents_read_member on public.documents for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = documents.community_id and m.user_id = (select auth.uid())));
create policy receipts_read_unit on public.receipts for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = receipts.community_id and m.user_id = (select auth.uid()) and (m.unit_id = receipts.unit_id or m.role = 'admin')));
create policy events_read_member on public.community_events for select to authenticated
  using (exists (select 1 from public.community_members m where m.community_id = community_events.community_id and m.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('incident-photos', 'incident-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
       ('community-documents', 'community-documents', false, 20971520, array['application/pdf']);

-- Signed URLs require SELECT. A path alone never grants file access.
create policy incident_photos_read_member on storage.objects for select to authenticated
  using (bucket_id = 'incident-photos' and exists (
    select 1 from public.incidents i where i.photo_path = objects.name
      and objects.name like i.community_id::text || '/' || i.id::text || '/%'
  ));
create policy incident_photos_upload_owner on storage.objects for insert to authenticated
  with check (bucket_id = 'incident-photos' and exists (
    select 1 from public.incidents i where i.reporter_id = (select auth.uid())
      and objects.name ~ ('^' || i.community_id::text || '/' || i.id::text || '/photo\.(jpg|png|webp)$')
  ));
create policy documents_read_authorized_row on storage.objects for select to authenticated
  using (bucket_id = 'community-documents' and (
    exists (select 1 from public.documents d where d.storage_path = objects.name and objects.name like d.community_id::text || '/%')
    or exists (select 1 from public.receipts r where r.storage_path = objects.name and objects.name like r.community_id::text || '/%')
  ));

-- Storage owns its existing grants/RLS; add only those needed for these policies.
grant select, insert on storage.objects to authenticated;
