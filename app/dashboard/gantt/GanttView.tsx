"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Gantt, { type FrappeTask } from "frappe-gantt";
import "./frappe-gantt.vendor.css";
import "./gantt.css";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import toast from "react-hot-toast";
import type { Project, Task, Team } from "@/types/database";
type Assignee = { task_id: string; profile_id: string };
type ViewMode = "Day" | "Week" | "Month";

const VIEW_MODES: ViewMode[] = ["Day", "Week", "Month"];

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

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

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [personFilter, setPersonFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    const [p, t, tm, m, a] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, is_external")
        .order("full_name"),
      supabase.from("task_assignees").select("task_id, profile_id"),
    ]);

    if (p.error || t.error || tm.error || m.error || a.error) {
      const err = p.error || t.error || tm.error || m.error || a.error;
      console.error("load gantt failed:", getErrorMessage(err), err);
      toast.error("Could not load timeline data.");
    } else {
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
    const ids = new Set<string>();
    projects.forEach((p) => {
      if (p.owner_id === personFilter) ids.add(p.id);
    });
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    assignees
      .filter((a) => a.profile_id === personFilter)
      .forEach((a) => {
        const task = taskById.get(a.task_id);
        if (task) ids.add(task.project_id);
      });
    return ids;
  }, [personFilter, projects, tasks, assignees]);

  // Build the flat bar list for Frappe Gantt from the current filters/expansion.
  const bars = useMemo<FrappeTask[]>(() => {
    const visibleProjects = projects.filter((p) => {
      if (teamFilter && p.team_id !== teamFilter) return false;
      if (personProjectIds && !personProjectIds.has(p.id)) return false;
      return true;
    });

    const result: FrappeTask[] = [];

    for (const p of visibleProjects) {
      const pStartRaw =
        p.start_date ||
        p.target_completion_date ||
        p.actual_completion_date ||
        today();
      const pEndRaw =
        p.actual_completion_date ||
        p.target_completion_date ||
        p.start_date ||
        pStartRaw;
      const { start, end } = normalizeRange(pStartRaw, pEndRaw);

      result.push({
        id: `project-${p.id}`,
        name: p.name,
        start,
        end,
        progress: progressFor(p.status),
        // Single CSS token only — frappe-gantt calls classList.add(custom_class)
        // which throws on space-separated tokens. "gp-" = gantt project.
        custom_class: `gp-${p.status}`,
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
        });
      }
    }

    return result;
  }, [
    projects,
    tasks,
    assignees,
    teamFilter,
    personFilter,
    personProjectIds,
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

    // Recreate on each change so the click closure always sees current state.
    container.innerHTML = "";
    ganttRef.current = new Gantt(container, bars, {
      view_mode: viewMode,
      readonly: true,
      popup_on: "hover",
      on_click: handleClick,
    });
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

        {(teamFilter || personFilter) && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setTeamFilter("");
              setPersonFilter("");
            }}
          >
            Clear filters
          </button>
        )}
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
