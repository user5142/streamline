-- Streamline — External org members (no auth account)
--
-- External members are placeholder profiles for vendors, partners, or anyone
-- not using Streamline. They can be added to teams and assigned to tasks/projects
-- like regular org members, but cannot sign in.

-- Drop the 1:1 FK to auth.users so profiles can exist without an auth account.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add column if not exists is_external boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_external_requires_org;

alter table public.profiles
  add constraint profiles_external_requires_org check (
    not is_external or org_id is not null
  );

alter table public.profiles
  drop constraint if exists profiles_external_requires_name;

alter table public.profiles
  add constraint profiles_external_requires_name check (
    not is_external or (full_name is not null and length(trim(full_name)) > 0)
  );

-- ---------------------------------------------------------------------------
-- create_external_member(full_name, email)
-- Admin-only. Creates a placeholder profile in the caller's org.
-- ---------------------------------------------------------------------------
create or replace function public.create_external_member(
  p_full_name text,
  p_email     text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  caller_org   uuid;
  new_profile  public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Only admins can add external members';
  end if;

  caller_org := public.current_org_id();
  if caller_org is null then
    raise exception 'User does not belong to an organization';
  end if;

  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'Name is required';
  end if;

  insert into public.profiles (id, org_id, full_name, email, role, is_external)
  values (
    gen_random_uuid(),
    caller_org,
    trim(p_full_name),
    nullif(trim(coalesce(p_email, '')), ''),
    'member',
    true
  )
  returning * into new_profile;

  return new_profile;
end;
$$;

grant execute on function public.create_external_member(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- delete_external_member(profile_id)
-- Admin-only. Removes a placeholder profile (cascades team/task assignments).
-- ---------------------------------------------------------------------------
create or replace function public.delete_external_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid;
  deleted    int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Only admins can remove external members';
  end if;

  caller_org := public.current_org_id();
  if caller_org is null then
    raise exception 'User does not belong to an organization';
  end if;

  delete from public.profiles
  where id = p_profile_id
    and org_id = caller_org
    and is_external = true;

  get diagnostics deleted = row_count;
  if deleted = 0 then
    raise exception 'External member not found';
  end if;
end;
$$;

grant execute on function public.delete_external_member(uuid) to authenticated;
