-- Streamline — Per-project Gantt visibility
--
-- Adds an opt-in/opt-out flag controlling whether a project appears on the
-- company-wide Gantt timeline (GNT-01). Users can create a project that is not
-- tracked on the Gantt initially and flip this on later from the project page.
--
-- Defaults to true so existing projects keep their current behavior (they all
-- show on the timeline today). The column is non-null; new projects fall back to
-- the default when the client omits it.

alter table public.projects
  add column if not exists show_on_gantt boolean not null default true;
