-- Streamline — Chunk 0: Core organizations + profiles + RLS helpers
-- Data model: Organization → Teams/Projects → Tasks → Action Items.
-- Single-org-per-profile model: each profile belongs to exactly one org and
-- carries one role (admin | member). See CLAUDE.md / streamline-requirements.md.

-- gen_random_uuid() is available by default on Supabase, but ensure pgcrypto.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- organizations (ORG-01)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,           -- unique human-friendly identifier
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (INF-02, ORG-03) — linked 1:1 to auth.users
-- org_id is null until the user creates or joins an org during onboarding.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  org_id      uuid references public.organizations(id) on delete set null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now()
);

create index if not exists profiles_org_id_idx on public.profiles(org_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER) — break RLS recursion on profiles.
-- A policy on profiles that itself queries profiles would recurse; these run
-- as the definer so they read profiles without re-triggering RLS.
-- ---------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever an auth user is created.
-- org_id/role are left at defaults and set during onboarding (Chunk 2).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

-- organizations: members can see their own org; only admins can update it.
-- Org creation is handled server-side during onboarding (Chunk 2), so no
-- broad INSERT policy here — it will be added with an onboarding RPC.
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (id = public.current_org_id());

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (id = public.current_org_id() and public.is_admin());

-- profiles: a user can always see/edit their own row; can see others in the
-- same org; admins can edit anyone in their org (role/team changes).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or (org_id is not null and org_id = public.current_org_id())
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (org_id = public.current_org_id() and public.is_admin());
