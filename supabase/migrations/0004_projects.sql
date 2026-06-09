-- Streamline — Chunk 0: Projects (PRJ-01..PRJ-04)
-- A project belongs to a team and carries metadata: owner, dates, budget,
-- status. SELECT is org-wide (the company-wide Gantt needs every project);
-- writes are open to any org member for the MVP (see note below).

create table if not exists public.projects (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references public.organizations(id) on delete cascade,
  team_id                  uuid references public.teams(id) on delete set null,
  name                     text not null,
  description              text,
  owner_id                 uuid references public.profiles(id) on delete set null,
  status                   text not null default 'not_started'
                             check (status in ('not_started', 'in_progress', 'complete', 'on_hold')),
  budget                   numeric(14, 2),
  start_date               date,
  target_completion_date   date,
  actual_completion_date   date,
  created_at               timestamptz not null default now()
);

create index if not exists projects_org_id_idx on public.projects(org_id);
create index if not exists projects_team_id_idx on public.projects(team_id);

alter table public.projects enable row level security;

-- SELECT: any org member (company-wide Gantt requirement, GNT-01).
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (org_id = public.current_org_id());

-- WRITE (MVP simplification): any authenticated member of the org can
-- create/edit/delete projects in their org. The requirement's finer-grained
-- "members edit only projects they're assigned to" will be tightened in a
-- later pass once the project-assignment model is finalized.
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert with check (org_id = public.current_org_id());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update using (org_id = public.current_org_id());

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete using (org_id = public.current_org_id());
