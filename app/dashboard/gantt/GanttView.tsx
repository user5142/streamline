"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Gantt, { type FrappeTask } from "frappe-gantt";
import "./frappe-gantt.vendor.css";
import "./gantt.css";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import {
  PROJECT_SORT_COLUMNS,
  sortProjects,
  type ProjectSortColumn,
  type SortDirection,
} from "@/libs/projectSort";
import { assignedProjectIds } from "@/libs/projectInvolvement";
import toast from "react-hot-toast";
import type { Project, Task, Team } from "@/types/database";
type Assignee = { task_id: string; profile_id: string };
type ViewMode = "Day" | "Week" | "Month";

const VIEW_MODES: ViewMode[] = ["Day", "Week", "Month"];

// Legend swatches mirror the saturated bar colors in gantt.css (the color a
// bar's progress fill takes). "Blocked" is task-only but shares amber's slot
// in meaning, so the five labels cover both project and task states.
const STATUS_LEGEND: { value: string; label: string; color: string }[] = [
  { value: "not_started", label: "Not started", color: "#cdc0c7" },
  { value: "in_progress", label: "In progress", color: "#811844" },
  { value: "complete", label: "Complete", color: "#059669" },
  { value: "on_hold", label: "On hold", color: "#b45309" },
  { value: "blocked", label: "Blocked", color: "#be123c" },
  // Modifier (not a status): the lighter tail a project bar grows past its
  // target completion date until it's actually completed.
  { value: "overdue", label: "Past target", color: "#f0c9a8" },
];

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (a: string, b: string): number =>
  (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) /
  86_400_000;

// Frappe needs a positive-width bar; ensure end is strictly after start.
const normalizeRange = (
  start: string,
  end: string
): { start: string; end: string } =>
  end > start ? { start, end } : { start, end: addDays(start, 1) };

const progressFor = (status: string): number =>
  status === "complete" ? 100 : status === "in_progress" ? 50 : 0;

export default function GanttView() {
  const supabase = createClient();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  // The view mode of the last chart we rendered. Used to decide whether a
  // rebuild should re-center on "today" (first load / view-mode change) or
  // preserve the user's current horizontal scroll (expand/collapse rebuilds).
  const lastViewModeRef = useRef<ViewMode | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default the timeline to the signed-in user's own assigned projects.
  const [mineOnly, setMineOnly] = useState<boolean>(true);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [personFilter, setPersonFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<ProjectSortColumn>("target");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    const [p, t, tm, m, a, u] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, is_external")
        .order("full_name"),
      supabase.from("task_assignees").select("task_id, profile_id"),
      supabase.auth.getUser(),
    ]);

    if (p.error || t.error || tm.error || m.error || a.error) {
      const err = p.error || t.error || tm.error || m.error || a.error;
      console.error("load gantt failed:", getErrorMessage(err), err);
      toast.error("Could not load timeline data.");
    } else {
      setCurrentUserId(u.data.user?.id ?? null);
      setProjects((p.data as Project[]) ?? []);
      setTasks((t.data as Task[]) ?? []);
      setTeams((tm.data as Team[]) ?? []);
      setMembers(
        ((m.data as OrgMember[]) ?? []).map((member) => ({
          ...member,
          is_external: member.is_external ?? false,
        }))
      );
      setAssignees((a.data as Assignee[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleExpanded = useCallback((projectId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // Project ids the filtered person is involved in (owner or task assignee).
  const personProjectIds = useMemo(() => {
    if (!personFilter) return null;
    return assignedProjectIds(personFilter, projects, tasks, assignees);
  }, [personFilter, projects, tasks, assignees]);

  // Project ids the signed-in user is assigned to, for the "My projects" default.
  const myProjectIds = useMemo(() => {
    if (!currentUserId) return null;
    return assignedProjectIds(currentUserId, projects, tasks, assignees);
  }, [currentUserId, projects, tasks, assignees]);

  // Build the flat bar list for Frappe Gantt from the current filters/expansion.
  const bars = useMemo<FrappeTask[]>(() => {
    const filtered = projects.filter((p) => {
      // Per-project opt-out: only projects flagged for the Gantt are shown.
      if (!p.show_on_gantt) return false;
      if (mineOnly && myProjectIds && !myProjectIds.has(p.id)) return false;
      if (teamFilter && p.team_id !== teamFilter) return false;
      if (personProjectIds && !personProjectIds.has(p.id)) return false;
      return true;
    });

    const visibleProjects = sortProjects(
      filtered,
      sortColumn,
      sortDirection,
      teams,
      members
    );

    const result: FrappeTask[] = [];

    const todayStr = today();

    for (const p of visibleProjects) {
      const pStartRaw =
        p.start_date ||
        p.target_completion_date ||
        p.actual_completion_date ||
        todayStr;
      const target = p.target_completion_date;
      const actual = p.actual_completion_date;

      // Two-tone "overdue" bars reuse frappe-gantt's track + progress layers:
      // the saturated status color fills start→target (.bar-progress), while
      // the lighter "past target" tail target→end shows through (.bar). We do
      // that by repurposing `progress` as the on-time fraction of the bar.
      let pEndRaw: string;
      let progress = progressFor(p.status);
      // Single CSS token only — frappe-gantt calls classList.add(custom_class)
      // which throws on space-separated tokens. "gp-" = gantt project.
      let customClass = `gp-${p.status}`;

      const overrun = (to: string) => {
        const total = daysBetween(pStartRaw, to);
        progress =
          total > 0
            ? Math.round((daysBetween(pStartRaw, target!) / total) * 100)
            : 0;
        customClass = `gp-overdue-${p.status}`;
      };

      // Running-overdue bars extend to today; their right edge is snapped flush
      // to the today marker after render (frappe's bar-width vs marker math
      // don't line up exactly across view modes).
      let clampToToday = false;

      if (actual) {
        // Completed: the bar always stops at the actual completion date. If it
        // finished after target, show the target→actual span as the tail.
        pEndRaw = actual;
        if (target && actual > target && pStartRaw <= target) overrun(actual);
      } else if (target && todayStr > target && pStartRaw <= target) {
        // Overdue and still running: continue the bar to today, tail past target.
        pEndRaw = todayStr;
        overrun(todayStr);
        clampToToday = true;
      } else {
        pEndRaw = target || p.start_date || pStartRaw;
      }

      const { start, end } = normalizeRange(pStartRaw, pEndRaw);

      result.push({
        id: `project-${p.id}`,
        name: p.name,
        start,
        end,
        progress,
        custom_class: customClass,
        // True completion % for the popup (visible `progress` is repurposed
        // above to size the two-tone overdue bar).
        _progressLabel: progressFor(p.status),
        _clampToToday: clampToToday,
      });

      if (!expanded.has(p.id)) continue;

      const projectTasks = tasks.filter((t) => {
        if (t.project_id !== p.id) return false;
        // When filtering by person, only show that person's tasks.
        if (personFilter) {
          return assignees.some(
            (a) => a.task_id === t.id && a.profile_id === personFilter
          );
        }
        return true;
      });

      for (const t of projectTasks) {
        const tStartRaw = t.start_date || t.due_date || start;
        const tEndRaw = t.due_date || t.start_date || tStartRaw;
        const range = normalizeRange(tStartRaw, tEndRaw);
        result.push({
          id: `task-${t.id}`,
          name: `   ↳ ${t.name}`,
          start: range.start,
          end: range.end,
          progress: progressFor(t.status),
          // "gt-" = gantt task (single token; see project note above).
          custom_class: `gt-${t.status}`,
          _progressLabel: progressFor(t.status),
        });
      }
    }

    return result;
  }, [
    projects,
    tasks,
    assignees,
    mineOnly,
    myProjectIds,
    teamFilter,
    personFilter,
    personProjectIds,
    sortColumn,
    sortDirection,
    teams,
    members,
    expanded,
  ]);

  // (Re)render the chart whenever the bar set or view mode changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (bars.length === 0) {
      container.innerHTML = "";
      ganttRef.current = null;
      return;
    }

    const handleClick = (task: FrappeTask) => {
      if (task.id.startsWith("project-")) {
        toggleExpanded(task.id.replace("project-", ""));
      } else if (task.id.startsWith("task-")) {
        const taskId = task.id.replace("task-", "");
        const t = tasks.find((x) => x.id === taskId);
        if (t) router.push(`/dashboard/projects/${t.project_id}`);
      }
    };

    // Capture the current horizontal scroll before teardown so expand/collapse
    // rebuilds (same view mode) can restore it instead of jumping to center.
    const prevScroller =
      container.querySelector<HTMLElement>(".gantt-container");
    const prevScrollLeft = prevScroller ? prevScroller.scrollLeft : null;

    // Recreate on each change so the click closure always sees current state.
    container.innerHTML = "";
    ganttRef.current = new Gantt(container, bars, {
      view_mode: viewMode,
      readonly: true,
      popup_on: "hover",
      on_click: handleClick,
      // Fixed timeline padding (no scroll-driven re-renders) so the post-render
      // "snap overdue tail to today" tweak below isn't wiped out on scroll.
      infinite_padding: false,
      // Suppress frappe's default smooth scroll-to-today (it parks today near
      // the left edge). We position the scroll ourselves in position() below.
      scroll_to: null,
      // Show the project/task's real completion % — the visible `progress` is
      // repurposed to size the two-tone overdue bar, so read `_progressLabel`.
      popup: (ctx) => {
        const t = ctx.task;
        ctx.set_title(t.name.replace(/^[\s↳]+/, ""));
        ctx.set_subtitle("");
        const start = t._start instanceof Date ? t._start : new Date(t.start);
        const rawEnd = t._end instanceof Date ? t._end : new Date(t.end);
        // frappe's _end is exclusive (00:00 of the day after); show last day.
        const lastDay = new Date(rawEnd.getTime() - 1000);
        const end = lastDay >= start ? lastDay : start;
        const fmt = (d: Date) =>
          d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const pct =
          typeof t._progressLabel === "number"
            ? t._progressLabel
            : Math.round(t.progress ?? 0);
        ctx.set_details(`${fmt(start)} – ${fmt(end)}<br/>Progress: ${pct}%`);
      },
      // Roomier, more refined bar geometry than the stock defaults.
      bar_height: 26,
      bar_corner_radius: 4,
      padding: 18,
      // Horizontal-only grid lines read cleaner than the full grid.
      lines: "horizontal",
    });

    // Snap each running-overdue bar's right edge exactly to the today marker.
    // frappe sizes bars by day-count but positions the today line by a
    // fractional date diff, so the amber tail can overshoot/undershoot the
    // line by a few px; align them precisely against the rendered marker.
    const snapOverdueToToday = () => {
      const todayLine =
        container.querySelector<HTMLElement>(".current-highlight");
      if (!todayLine) return;
      const todayX = parseFloat(todayLine.style.left || "");
      if (!Number.isFinite(todayX)) return;
      for (const bar of bars) {
        if (!bar._clampToToday) continue;
        const rect = container.querySelector<SVGRectElement>(
          `.bar-wrapper[data-id="${bar.id}"] .bar`
        );
        if (!rect) continue;
        const x = parseFloat(rect.getAttribute("x") || "0");
        if (todayX > x) rect.setAttribute("width", String(todayX - x));
      }
    };
    requestAnimationFrame(snapOverdueToToday);

    // Position the timeline. On first load / view-mode change we center the
    // "today" marker (equal past and future visible); on same-view-mode rebuilds
    // (expand/collapse, and React Strict Mode's dev double-mount) we restore the
    // prior scroll so nothing jumps. With scroll_to:null frappe's own scroll is a
    // no-op, so setting scrollLeft here — synchronously, before paint — sticks
    // without any competing animation and without a visible left→center hop.
    const recenter = lastViewModeRef.current !== viewMode;
    const position = (): boolean => {
      const scroller = container.querySelector<HTMLElement>(".gantt-container");
      if (!scroller || scroller.clientWidth === 0) return false;
      if (!recenter && prevScrollLeft != null) {
        scroller.scrollLeft = prevScrollLeft;
        lastViewModeRef.current = viewMode;
        return true;
      }
      const todayLine =
        container.querySelector<HTMLElement>(".current-highlight");
      const todayX = todayLine ? parseFloat(todayLine.style.left || "") : NaN;
      if (!Number.isFinite(todayX)) return false;
      scroller.scrollLeft = Math.max(0, todayX - scroller.clientWidth / 2);
      lastViewModeRef.current = viewMode;
      return true;
    };

    // Try synchronously (forces layout, usually succeeds → no flicker); fall back
    // to a frame-by-frame retry only if the grid hasn't been measured yet.
    let centerRaf = 0;
    if (!position()) {
      let frames = 0;
      const attempt = () => {
        if (position()) return;
        if (frames++ < 10) centerRaf = requestAnimationFrame(attempt);
      };
      centerRaf = requestAnimationFrame(attempt);
    }

    // Scroll UX: let vertical wheel events use the browser's native page-scroll
    // physics. The only custom work here is preventing wheel/trackpad input from
    // nudging the horizontal timeline; users can still pan dates with the
    // visible scrollbar.
    const scroller = container.querySelector<HTMLElement>(".gantt-container");
    if (!scroller) return () => cancelAnimationFrame(centerRaf);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
        e.preventDefault();
        return;
      }

      const scrollLeft = scroller.scrollLeft;
      window.requestAnimationFrame(() => {
        scroller.scrollLeft = scrollLeft;
      });
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(centerRaf);
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [bars, viewMode, tasks, toggleExpanded, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="form-control">
          <span className="label-text mb-1">Show</span>
          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-3">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-solid"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            <span className="whitespace-nowrap text-xs">My projects</span>
          </label>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Team</span>
          <select
            value={teamFilter}
            className="select select-bordered select-sm"
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Person</span>
          <select
            value={personFilter}
            className="select select-bordered select-sm"
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberDisplayLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Sort by</span>
          <div className="flex gap-1">
            <select
              value={sortColumn}
              className="select select-bordered select-sm"
              onChange={(e) => {
                setSortColumn(e.target.value as ProjectSortColumn);
                setSortDirection("asc");
              }}
            >
              {PROJECT_SORT_COLUMNS.map((col) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-square btn-bordered"
              aria-label={
                sortDirection === "asc"
                  ? "Sorted ascending"
                  : "Sorted descending"
              }
              onClick={() =>
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
              }
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </label>

        <div className="join">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm join-item ${
                viewMode === mode ? "btn-active" : ""
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {(mineOnly || teamFilter || personFilter) && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setMineOnly(false);
              setTeamFilter("");
              setPersonFilter("");
            }}
          >
            Clear filters
          </button>
        )}

        {/* Bar colors carry status — name them so the timeline is readable. */}
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {STATUS_LEGEND.map((s) => (
            <span
              key={s.value}
              className="inline-flex items-center gap-1.5 text-xs text-base-content/70"
            >
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {bars.length === 0 ? (
        <p className="text-sm text-base-content/60 py-12 text-center">
          No projects match these filters. Projects need at least a date to
          appear on the timeline.
        </p>
      ) : (
        <div className="card bg-base-100 border border-base-300 overflow-x-auto">
          <div className="card-body p-2">
            <div ref={containerRef} className="gantt-target"></div>
          </div>
        </div>
      )}
    </div>
  );
}
