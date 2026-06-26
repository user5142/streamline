-- Streamline — Personal to-do list (per-user)
--
-- A lightweight personal checklist that is NOT org-scoped like the rest of the
-- app: each row belongs to a single user and is visible only to that user. RLS
-- is therefore keyed on owner_id = auth.uid() rather than current_org_id().
--
-- org_id is carried along for convenience/consistency (and to keep the user's
-- list scoped to their current org), but it is not the access-control boundary —
-- ownership is. New items append to the end of the list; `position` drives the
-- display order so users can drag rows up/down to re-arrange them.

create table if not exists public.todo_items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
                references public.profiles(id) on delete cascade,
  org_id      uuid references public.organizations(id) on delete cascade,
  content     text not null,
  is_complete boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists todo_items_owner_idx
  on public.todo_items(owner_id, position);

alter table public.todo_items enable row level security;

-- Owner-only access. Unlike org-scoped tables, a user can only ever see and
-- mutate their own rows.
drop policy if exists todo_items_select on public.todo_items;
create policy todo_items_select on public.todo_items
  for select using (owner_id = auth.uid());

drop policy if exists todo_items_insert on public.todo_items;
create policy todo_items_insert on public.todo_items
  for insert with check (owner_id = auth.uid());

drop policy if exists todo_items_update on public.todo_items;
create policy todo_items_update on public.todo_items
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists todo_items_delete on public.todo_items;
create policy todo_items_delete on public.todo_items
  for delete using (owner_id = auth.uid());

-- Table-level privileges (RLS still restricts rows to the owner).
grant select, insert, update, delete on public.todo_items to authenticated;
