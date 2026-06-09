-- Streamline — Chunk 2 fix: base table GRANTs for the authenticated role.
--
-- Supabase's access model is two-layer: a role needs table-level privileges
-- (GRANT) to touch a table AT ALL, and RLS policies then filter which rows it
-- sees. RLS alone is not enough — without GRANTs, queries fail with
-- "permission denied for table ...". The tables created in migrations 0001-0005
-- did not receive these grants automatically, so we apply them explicitly here.
--
-- Row visibility is still fully governed by the org-scoped RLS policies defined
-- in the earlier migrations; these grants just open the door for RLS to do its
-- job.

grant usage on schema public to anon, authenticated;

-- Standard CRUD for org-scoped tables (RLS restricts to the user's own org).
grant select, insert, update, delete on public.organizations  to authenticated;
grant select, insert, update, delete on public.invites        to authenticated;
grant select, insert, update, delete on public.teams          to authenticated;
grant select, insert, update, delete on public.team_members   to authenticated;
grant select, insert, update, delete on public.projects       to authenticated;
grant select, insert, update, delete on public.tasks          to authenticated;
grant select, insert, update, delete on public.task_assignees to authenticated;
grant select, insert, update, delete on public.action_items   to authenticated;

-- profiles: select/insert/delete, but UPDATE only on the safe column. This
-- preserves the org_id/role lockdown from migration 0006 (those columns can
-- only be changed by SECURITY DEFINER functions like create_organization).
grant select, insert, delete on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
