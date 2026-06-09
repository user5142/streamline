-- Streamline — Chunk 0: Invites (INV-01..INV-04, ORG-02)
-- Token-based, 7-day expiry, single-use. Distribution is manual (no email).
-- Token validation/redemption is done via a SECURITY DEFINER RPC (Chunk 3)
-- because a newly-signed-up user has no org_id yet and so cannot read the row
-- under normal org-scoped RLS.

create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  token       text not null unique,
  email       text,                                   -- optional intended recipient
  role        text not null default 'member' check (role in ('admin', 'member')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz,                            -- null until redeemed (single-use)
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists invites_org_id_idx on public.invites(org_id);
create index if not exists invites_token_idx on public.invites(token);

alter table public.invites enable row level security;

-- Admins manage invites within their own org. Redemption by invitees happens
-- through a SECURITY DEFINER RPC, not through these policies.
drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select using (org_id = public.current_org_id() and public.is_admin());

drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites
  for insert with check (org_id = public.current_org_id() and public.is_admin());

drop policy if exists invites_update on public.invites;
create policy invites_update on public.invites
  for update using (org_id = public.current_org_id() and public.is_admin());

drop policy if exists invites_delete on public.invites;
create policy invites_delete on public.invites
  for delete using (org_id = public.current_org_id() and public.is_admin());
