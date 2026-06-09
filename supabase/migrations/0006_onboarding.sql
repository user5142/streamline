-- Streamline — Chunk 2: Organization creation + onboarding (ORG-01, ORG-03)
--
-- Org creation runs through a SECURITY DEFINER RPC rather than a direct INSERT.
-- A just-signed-up user has org_id = null, so current_org_id() is null and no
-- ordinary RLS policy could let them create an org and then read it back. The
-- function runs as its owner (bypassing RLS for its internal writes), creates
-- the org, and promotes the caller to admin of that org — atomically.

-- ---------------------------------------------------------------------------
-- Lock down org_id / role on profiles.
--
-- Chunk 0's profiles_update_self policy lets a user update their own row. As
-- granted by default that includes org_id and role, which would let anyone
-- self-assign to any org or escalate to admin via a plain UPDATE. Column-level
-- privileges fix this: remove blanket UPDATE and re-grant only the safe column.
-- After this, org_id/role can ONLY be changed by SECURITY DEFINER functions
-- (which run as the table owner) — i.e. create_organization and, later,
-- redeem_invite. RLS policies still apply on top of these grants.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- create_organization(org_name, full_name)
-- Creates an org, sets the caller as its admin, and (optionally) records the
-- caller's display name. Returns the new organization row.
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(
  org_name  text,
  full_name text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid           uuid := auth.uid();
  existing_org  uuid;
  base_slug     text;
  final_slug    text;
  suffix        int := 1;
  new_org       public.organizations;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- A user may only ever create/join one org (single-org model).
  select org_id into existing_org from public.profiles where id = uid;
  if existing_org is not null then
    raise exception 'User already belongs to an organization';
  end if;

  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'Organization name is required';
  end if;

  -- Slugify: lowercase, collapse runs of non-alphanumerics to a single hyphen,
  -- strip leading/trailing hyphens. Fall back to 'org' if nothing survives.
  base_slug := trim(both '-' from
    regexp_replace(lower(trim(org_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'org';
  end if;

  -- De-duplicate: acme-corp, acme-corp-2, acme-corp-3, ...
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into public.organizations (name, slug)
  values (trim(org_name), final_slug)
  returning * into new_org;

  update public.profiles
  set org_id    = new_org.id,
      role      = 'admin',
      full_name = coalesce(
        nullif(trim(create_organization.full_name), ''),
        public.profiles.full_name
      )
  where id = uid;

  return new_org;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;
