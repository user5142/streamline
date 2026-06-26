"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import {
  TASK_STATUSES,
  taskStatusLabel,
  taskStatusBadgeClass,
} from "@/libs/status";
import {
  MY_TASK_SORT_COLUMNS,
  sortMyTasks,
  type MyTaskActionItem,
  type MyTaskRow,
  type SortDirection,
  type TaskSortColumn,
} from "@/libs/taskSort";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import type { Task, TaskStatus } from "@/types/database";
import toast from "react-hot-toast";

type ProjectOption = { id: string; name: string };

export default function MyTasksClient({
  tasks: initialTasks,
  orgId,
  currentUserId,
  projects,
  members,
}: {
  tasks: MyTaskRow[];
  orgId: string;
  currentUserId: string;
  projects: ProjectOption[];
  members: OrgMember[];
}) {
  const supabase = createClient();

  const [tasks, setTasks] = useState<MyTaskRow[]>(initialTasks);
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<TaskSortColumn>("project");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // New-task form. Defaults to the current project picker + self-assigned so
  // the created task shows up in this "assigned to me" view.
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newProjectId, setNewProjectId] = useState<string>(
    projects[0]?.id ?? ""
  );
  const [newName, setNewName] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("not_started");
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newAssignees, setNewAssignees] = useState<string[]>([currentUserId]);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [projects]
  );

  const toggleNewAssignee = (profileId: string) =>
    setNewAssignees((prev) =>
      prev.includes(profileId)
        ? prev.filter((p) => p !== profileId)
        : [...prev, profileId]
    );

  const resetCreateForm = () => {
    setNewProjectId(projects[0]?.id ?? "");
    setNewName("");
    setNewStatus("not_started");
    setNewStartDate("");
    setNewDueDate("");
    setNewAssignees([currentUserId]);
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newProjectId) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          org_id: orgId,
          project_id: newProjectId,
          name: newName.trim(),
          status: newStatus,
          start_date: newStartDate || null,
          due_date: newDueDate || null,
        })
        .select()
        .single();
      if (error) throw error;

      const created = data as Task;

      if (newAssignees.length) {
        const rows = newAssignees.map((profile_id) => ({
          task_id: created.id,
          profile_id,
        }));
        const { error: aErr } = await supabase
          .from("task_assignees")
          .insert(rows);
        if (aErr) throw aErr;
      }

      // This view only lists tasks assigned to me; add it locally only when
      // I'm an assignee (otherwise it simply lives on its project).
      if (newAssignees.includes(currentUserId)) {
        const projectName =
          sortedProjects.find((p) => p.id === created.project_id)?.name ?? "—";
        const newRow: MyTaskRow = {
          id: created.id,
          name: created.name,
          status: created.status,
          due_date: created.due_date,
          project_id: created.project_id,
          projects: { name: projectName },
          action_items: [],
        };
        setTasks((prev) => [...prev, newRow]);
      }

      resetCreateForm();
      setShowCreate(false);
      toast.success(
        newAssignees.includes(currentUserId)
          ? "Task added."
          : "Task added to project."
      );
    } catch (error) {
      console.error("create task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

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

  const projectGroups = useMemo(() => {
    const byProject = new Map<
      string,
      {
        id: string;
        name: string;
        tasks: MyTaskRow[];
        completeCount: number;
      }
    >();

    visibleTasks.forEach((task) => {
      const group = byProject.get(task.project_id) ?? {
        id: task.project_id,
        name: task.projects?.name ?? "—",
        tasks: [],
        completeCount: 0,
      };

      group.tasks.push(task);
      if (task.status === "complete") {
        group.completeCount += 1;
      }
      byProject.set(task.project_id, group);
    });

    return [...byProject.values()];
  }, [visibleTasks]);

  const updateTaskInState = (taskId: string, patch: Partial<MyTaskRow>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
  };

  const updateActionItemInState = (
    taskId: string,
    itemId: string,
    patch: Partial<MyTaskActionItem>
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              action_items: t.action_items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              ),
            }
          : t
      )
    );
  };

  const toggleTaskComplete = async (task: MyTaskRow) => {
    const nextStatus: TaskStatus =
      task.status === "complete" ? "not_started" : "complete";
    const previousStatus = task.status;

    updateTaskInState(task.id, { status: nextStatus });
    setTogglingTaskId(task.id);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: nextStatus })
        .eq("id", task.id);
      if (error) throw error;
    } catch (error) {
      updateTaskInState(task.id, { status: previousStatus });
      console.error("toggle task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingTaskId(null);
    }
  };

  const toggleActionItem = async (
    taskId: string,
    item: MyTaskActionItem
  ) => {
    const nextComplete = !item.is_complete;

    updateActionItemInState(taskId, item.id, {
      is_complete: nextComplete,
    });
    setTogglingItemId(item.id);

    try {
      const { error } = await supabase
        .from("action_items")
        .update({ is_complete: nextComplete })
        .eq("id", item.id);
      if (error) throw error;
    } catch (error) {
      updateActionItemInState(taskId, item.id, {
        is_complete: item.is_complete,
      });
      console.error("toggle action item failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingItemId(null);
    }
  };

  const clearFilters = () => {
    setProjectFilter("");
    setStatusFilter("");
  };

  const noProjects = sortedProjects.length === 0;

  const createSection = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-base-content/60">
          {tasks.length === 0
            ? "No tasks assigned to you yet."
            : hasActiveFilters
              ? `${visibleTasks.length} of ${tasks.length} tasks`
              : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
        </p>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={noProjects}
          title={
            noProjects ? "Create a project before adding tasks." : undefined
          }
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Cancel" : "New task"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateTask}
          className="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1">Project *</span>
              <select
                required
                value={newProjectId}
                className="select select-bordered"
                onChange={(e) => setNewProjectId(e.target.value)}
              >
                {sortedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1">Task name *</span>
              <input
                required
                type="text"
                value={newName}
                className="input input-bordered"
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Status</span>
              <select
                value={newStatus}
                className="select select-bordered"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden md:block" />
            <label className="form-control">
              <span className="label-text mb-1">Start date</span>
              <input
                type="date"
                value={newStartDate}
                className="input input-bordered"
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Due date</span>
              <input
                type="date"
                value={newDueDate}
                className="input input-bordered"
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </label>
          </div>

          {members.length > 0 && (
            <div>
              <span className="label-text">Assignees</span>
              <div className="mt-1 flex flex-wrap gap-3">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={newAssignees.includes(m.id)}
                      onChange={() => toggleNewAssignee(m.id)}
                    />
                    {memberDisplayLabel(m)}
                    {m.id === currentUserId && (
                      <span className="text-base-content/50">(you)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSaving || !newName.trim() || !newProjectId}
            >
              {isSaving && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              Add task
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        {createSection}
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-base-content">
            You&apos;re all clear
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
            Tasks assigned to you will show up here. Use{" "}
            <span className="font-medium">New task</span> to add one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {createSection}

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

            <label className="form-control">
              <span className="label-text mb-1">Sort by</span>
              <div className="flex gap-1">
                <select
                  value={sortColumn}
                  className="select select-bordered select-sm"
                  onChange={(e) => {
                    setSortColumn(e.target.value as TaskSortColumn);
                    setSortDirection("asc");
                  }}
                >
                  {MY_TASK_SORT_COLUMNS.map((col) => (
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

          <div className="space-y-4">
            {projectGroups.map((group) => {
              const remainingCount = group.tasks.length - group.completeCount;

              return (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-base-300 bg-gradient-to-r from-primary/10 via-base-100 to-base-100 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
                      {group.name.trim().slice(0, 1).toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/projects/${group.id}`}
                        className="link link-hover font-display text-lg font-semibold text-base-content"
                      >
                        {group.name}
                      </Link>
                      <p className="text-xs text-base-content/60">
                        {group.completeCount}/{group.tasks.length} complete
                        {remainingCount > 0
                          ? `, ${remainingCount} remaining`
                          : ", all wrapped"}
                      </p>
                    </div>
                    <span className="badge badge-ghost">
                      {group.tasks.length}{" "}
                      {group.tasks.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>

                  <div className="divide-y divide-base-200">
                    {group.tasks.map((t) => (
                      <article
                        key={t.id}
                        className="grid gap-3 px-4 py-4 transition-colors hover:bg-base-200/50 md:grid-cols-[1fr_auto_auto] md:items-start"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mt-0.5"
                            checked={t.status === "complete"}
                            disabled={togglingTaskId === t.id}
                            aria-label={`Mark "${t.name}" complete`}
                            onChange={() => toggleTaskComplete(t)}
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/dashboard/tasks/${t.id}`}
                              className={`link link-hover font-medium ${
                                t.status === "complete"
                                  ? "line-through text-base-content/60"
                                  : ""
                              }`}
                            >
                              {t.name}
                            </Link>
                            {t.action_items.length > 0 && (
                              <ul className="mt-3 space-y-2 border-l-2 border-primary/20 pl-3">
                                {t.action_items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex items-center gap-2 text-sm font-normal text-base-content/80"
                                  >
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-xs"
                                      checked={item.is_complete}
                                      disabled={togglingItemId === item.id}
                                      aria-label={item.title}
                                      onChange={() =>
                                        toggleActionItem(t.id, item)
                                      }
                                    />
                                    <span
                                      className={
                                        item.is_complete
                                          ? "line-through text-base-content/50"
                                          : ""
                                      }
                                    >
                                      {item.title}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="md:justify-self-end">
                          <span className={taskStatusBadgeClass(t.status)}>
                            {taskStatusLabel(t.status)}
                          </span>
                        </div>

                        <div className="text-sm text-base-content/60 md:min-w-24 md:text-right">
                          <span className="md:hidden">Due </span>
                          {t.due_date
                            ? new Date(t.due_date).toLocaleDateString()
                            : "No due date"}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
