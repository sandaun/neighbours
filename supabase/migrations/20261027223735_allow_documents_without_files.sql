-- A document can be listed before its private file is attached.
alter table public.documents alter column storage_path drop not null;
