"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TASK_STATUSES, taskStatusLabel, taskStatusBadgeClass } from "@/libs/status";
import {
  sortMyTasks,
  type MyTaskRow,
  type SortDirection,
  type TaskSortColumn,
} from "@/libs/taskSort";

export default function MyTasksClient({ tasks }: { tasks: MyTaskRow[] }) {
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<TaskSortColumn>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const projectOptions = useMemo(() => {
    const byId = new Map<string, string>();
    tasks.forEach((t) => {
      if (!byId.has(t.project_id)) {
        byId.set(t.project_id, t.projects?.name ?? "—");
      }
    });
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
  }, [tasks]);

  const hasActiveFilters = Boolean(projectFilter || statusFilter);

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((t) => {
      if (projectFilter && t.project_id !== projectFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      return true;
    });

    return sortMyTasks(filtered, sortColumn, sortDirection);
  }, [tasks, projectFilter, statusFilter, sortColumn, sortDirection]);

  const handleSort = (column: TaskSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setProjectFilter("");
    setStatusFilter("");
  };

  const SortHeader = ({
    column,
    label,
  }: {
    column: TaskSortColumn;
    label: string;
  }) => (
    <th>
      <button
        type="button"
        className="flex items-center gap-1 font-semibold hover:text-base-content"
        onClick={() => handleSort(column)}
      >
        {label}
        <span
          className={
            sortColumn === column
              ? "text-base-content"
              : "text-base-content/30"
          }
          aria-hidden="true"
        >
          {sortColumn === column ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold text-base-content">
          You&apos;re all clear
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
          Tasks assigned to you will show up here once they&apos;re created on a
          project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/60">
        {hasActiveFilters
          ? `${visibleTasks.length} of ${tasks.length} tasks`
          : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
      </p>

      {visibleTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-base-content">
            No tasks match your filters
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
            Try changing the project or status filters.
          </p>
          <button className="btn btn-ghost mt-5" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <label className="form-control">
              <span className="label-text mb-1">Project</span>
              <select
                value={projectFilter}
                className="select select-bordered select-sm"
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">All projects</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1">Status</span>
              <select
                value={statusFilter}
                className="select select-bordered select-sm"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
            <table className="table">
              <thead className="bg-base-200 text-xs uppercase tracking-wide text-base-content/50">
                <tr>
                  <SortHeader column="name" label="Task" />
                  <SortHeader column="project" label="Project" />
                  <SortHeader column="status" label="Status" />
                  <SortHeader column="due_date" label="Due" />
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((t) => (
                  <tr key={t.id} className="hover">
                    <td className="font-medium">{t.name}</td>
                    <td className="text-sm">
                      <Link
                        href={`/dashboard/projects/${t.project_id}`}
                        className="link link-hover"
                      >
                        {t.projects?.name ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <span className={taskStatusBadgeClass(t.status)}>
                        {taskStatusLabel(t.status)}
                      </span>
                    </td>
                    <td className="text-sm">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
