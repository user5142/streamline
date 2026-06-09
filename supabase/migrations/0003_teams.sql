-- Streamline — Chunk 0: Teams (TM-01..TM-04)
-- Teams are first-class objects. Users belong to one or more teams; projects
-- are assigned to a team. Team management is admin-only.

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists teams_org_id_idx on public.teams(org_id);

create table if not exists public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (team_id, profile_id)
);

create index if not exists team_members_profile_idx on public.team_members(profile_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- teams: everyone in the org can see teams (needed for project assignment and
-- Gantt filters); only admins create/edit/delete.
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select using (org_id = public.current_org_id());

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert with check (org_id = public.current_org_id() and public.is_admin());

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update using (org_id = public.current_org_id() and public.is_admin());

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams
  for delete using (org_id = public.current_org_id() and public.is_admin());

-- team_members: visible to anyone in the org (membership powers Gantt
-- by-team / by-person filters); managed by admins only.
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select using (
    exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and t.org_id = public.current_org_id()
    )
  );

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members
  for insert with check (
    public.is_admin() and exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and t.org_id = public.current_org_id()
    )
  );

drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members
  for delete using (
    public.is_admin() and exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and t.org_id = public.current_org_id()
    )
  );
