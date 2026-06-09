-- Streamline — Chunk 0: Tasks + Action Items (TSK-01..TSK-04)
-- Project → Task → Action Item. Tasks carry their own status (independent of
-- the project) and can have multiple assignees. Action items are lightweight
-- checklist subtasks (no assignee/due date for MVP).
-- org_id is denormalized onto tasks so RLS stays a simple equality check.

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  description text,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'complete', 'blocked')),
  start_date  date,
  due_date    date,
  created_at  timestamptz not null default now()
);

create index if not exists tasks_org_id_idx on public.tasks(org_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);

-- Multiple assignees per task (TSK-03).
create table if not exists public.task_assignees (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (task_id, profile_id)
);

create index if not exists task_assignees_profile_idx on public.task_assignees(profile_id);

-- Action items: checklist subtasks within a task (TSK-02).
create table if not exists public.action_items (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  title       text not null,
  is_complete boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists action_items_task_id_idx on public.action_items(task_id);

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.action_items enable row level security;

-- tasks: org-wide select (task-level Gantt bars), org-member writes (MVP).
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (org_id = public.current_org_id());

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (org_id = public.current_org_id());

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (org_id = public.current_org_id());

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete using (org_id = public.current_org_id());

-- task_assignees: scoped through the parent task's org.
drop policy if exists task_assignees_select on public.task_assignees;
create policy task_assignees_select on public.task_assignees
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_assignees.task_id
        and t.org_id = public.current_org_id()
    )
  );

drop policy if exists task_assignees_insert on public.task_assignees;
create policy task_assignees_insert on public.task_assignees
  for insert with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_assignees.task_id
        and t.org_id = public.current_org_id()
    )
  );

drop policy if exists task_assignees_delete on public.task_assignees;
create policy task_assignees_delete on public.task_assignees
  for delete using (
    exists (
      select 1 from public.tasks t
      where t.id = task_assignees.task_id
        and t.org_id = public.current_org_id()
    )
  );

-- action_items: scoped through task → org.
drop policy if exists action_items_select on public.action_items;
create policy action_items_select on public.action_items
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = action_items.task_id
        and t.org_id = public.current_org_id()
    )
  );

drop policy if exists action_items_write on public.action_items;
create policy action_items_write on public.action_items
  for all using (
    exists (
      select 1 from public.tasks t
      where t.id = action_items.task_id
        and t.org_id = public.current_org_id()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      where t.id = action_items.task_id
        and t.org_id = public.current_org_id()
    )
  );
