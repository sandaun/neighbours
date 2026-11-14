-- Street address and municipality identify the building behind a community name.
-- Both start optional: existing communities are backfilled with verified addresses
-- first, and a later migration makes them NOT NULL.
-- Adding nullable columns without a default only touches the catalog, so the
-- ALTER does not rewrite the table.
alter table public.communities
  add column address_line text
    constraint communities_address_line_length
    check (char_length(btrim(address_line)) between 1 and 200),
  add column municipality text
    constraint communities_municipality_length
    check (char_length(btrim(municipality)) between 1 and 120);

comment on column public.communities.address_line is 'Street and number, e.g. "Carrer del Mar, 14".';
comment on column public.communities.municipality is 'Municipality, e.g. "Sitges".';
