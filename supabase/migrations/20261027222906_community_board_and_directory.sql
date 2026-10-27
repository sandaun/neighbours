-- Community content is maintained by the operator, with member-only reads.
create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  author_name text not null check (char_length(btrim(author_name)) between 1 and 160),
  topic text not null check (char_length(btrim(topic)) between 1 and 80),
  published_at timestamptz not null default now()
);
create index board_posts_community_idx on public.board_posts(community_id, published_at desc, id);

create table public.directory_contacts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  service text not null check (char_length(btrim(service)) between 1 and 300),
  phone text check (char_length(btrim(phone)) between 1 and 40),
  email text check (char_length(btrim(email)) between 1 and 160),
  hours text check (char_length(btrim(hours)) between 1 and 160),
  sort_order integer not null default 0
);
create index directory_contacts_community_idx on public.directory_contacts(community_id, sort_order, name, id);

alter table public.board_posts enable row level security;
alter table public.directory_contacts enable row level security;
revoke all on public.board_posts, public.directory_contacts from anon, authenticated;
grant select on public.board_posts, public.directory_contacts to authenticated;
grant all on public.board_posts, public.directory_contacts to service_role;

create policy board_posts_read_member on public.board_posts for select to authenticated
  using (published_at <= now() and exists (
    select 1 from public.community_members m
    where m.community_id = board_posts.community_id and m.user_id = (select auth.uid())
  ));
create policy directory_contacts_read_member on public.directory_contacts for select to authenticated
  using (exists (
    select 1 from public.community_members m
    where m.community_id = directory_contacts.community_id and m.user_id = (select auth.uid())
  ));
