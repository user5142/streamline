-- Streamline — Chunk 3 fix: invite token generation.
--
-- 0008 used gen_random_bytes() (pgcrypto), which on Supabase lives in the
-- `extensions` schema and is therefore invisible under `search_path = public`
-- (error 42883: "function gen_random_bytes(integer) does not exist").
--
-- Switch to the CORE gen_random_uuid() (in pg_catalog, always resolvable) and
-- concatenate two UUIDs into a 64-char hex token (~244 bits of entropy). No
-- extension dependency, no search_path concerns.

create or replace function public.create_invite()
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  uid         uuid := auth.uid();
  caller_org  uuid;
  new_invite  public.invites;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'Only admins can create invites';
  end if;

  select org_id into caller_org from public.profiles where id = uid;
  if caller_org is null then
    raise exception 'No organization';
  end if;

  insert into public.invites (org_id, token, role, expires_at, created_by)
  values (
    caller_org,
    replace(gen_random_uuid()::text, '-', '')
      || replace(gen_random_uuid()::text, '-', ''),
    'member',
    now() + interval '7 days',
    uid
  )
  returning * into new_invite;

  return new_invite;
end;
$$;

grant execute on function public.create_invite() to authenticated;
