-- Streamline — Chunk 3: Invite-by-link RPCs (INV-01..INV-04, ORG-02)
--
-- No email service is involved: an admin generates a link in-app and shares it
-- manually. All three functions are SECURITY DEFINER because the parties can't
-- read the `invites` table under normal RLS (a prospective member has no
-- org_id; admins only see their own org's rows). The token IS the credential,
-- so entropy, expiry, and single-use are enforced here, server-side.

-- ---------------------------------------------------------------------------
-- create_invite() — admin only. MVP invites are always role = 'member'.
-- Returns the new invite row (the app builds the link from its token).
-- ---------------------------------------------------------------------------
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
    encode(gen_random_bytes(16), 'hex'),  -- 128-bit random token
    'member',
    now() + interval '7 days',
    uid
  )
  returning * into new_invite;

  return new_invite;
end;
$$;

grant execute on function public.create_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- get_invite_preview(token) — callable by anyone (the recipient may not be
-- signed in yet). Returns only validity + org name; never leaks the token list.
-- reason ∈ ('ok','expired','used','not_found').
-- ---------------------------------------------------------------------------
create or replace function public.get_invite_preview(invite_token text)
returns table (valid boolean, org_name text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invites;
  org public.organizations;
begin
  select * into inv from public.invites where token = invite_token;

  if not found then
    return query select false, null::text, 'not_found';
    return;
  end if;
  if inv.used_at is not null then
    return query select false, null::text, 'used';
    return;
  end if;
  if inv.expires_at <= now() then
    return query select false, null::text, 'expired';
    return;
  end if;

  select * into org from public.organizations where id = inv.org_id;
  return query select true, org.name, 'ok';
end;
$$;

grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- redeem_invite(token, full_name) — joins the caller to the invite's org.
-- Locks the invite row (FOR UPDATE) so two simultaneous clicks can't both
-- redeem it (single-use, INV-03). Returns the joined organization.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_invite(
  invite_token text,
  full_name    text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid           uuid := auth.uid();
  existing_org  uuid;
  inv           public.invites;
  org           public.organizations;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select org_id into existing_org from public.profiles where id = uid;
  if existing_org is not null then
    raise exception 'User already belongs to an organization';
  end if;

  -- Lock the row to serialize concurrent redemptions of the same token.
  select * into inv from public.invites where token = invite_token for update;

  if not found then
    raise exception 'Invalid invite';
  end if;
  if inv.used_at is not null then
    raise exception 'This invite has already been used';
  end if;
  if inv.expires_at <= now() then
    raise exception 'This invite has expired';
  end if;

  update public.profiles
  set org_id    = inv.org_id,
      role      = inv.role,
      full_name = coalesce(
        nullif(trim(redeem_invite.full_name), ''),
        public.profiles.full_name
      )
  where id = uid;

  update public.invites set used_at = now() where id = inv.id;

  select * into org from public.organizations where id = inv.org_id;
  return org;
end;
$$;

grant execute on function public.redeem_invite(text, text) to authenticated;
