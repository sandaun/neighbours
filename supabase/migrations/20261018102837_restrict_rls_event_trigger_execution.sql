-- Hosted bootstrap RLS automation is an event trigger, not a client RPC.
-- Keep its function body, owner, service-role access, and trigger unchanged.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    if not exists (
      select 1 from pg_catalog.pg_proc
      where oid = to_regprocedure('public.rls_auto_enable()')
        and prorettype = 'pg_catalog.event_trigger'::regtype
    ) then
      raise exception 'Expected public.rls_auto_enable() to return event_trigger';
    end if;
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
