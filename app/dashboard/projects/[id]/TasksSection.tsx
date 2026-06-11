"use client";

import { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import {
  TASK_STATUSES,
  taskStatusLabel,
  taskStatusBadgeClass,
} from "@/libs/status";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import {
  PROJECT_TASK_SORT_COLUMNS,
  sortProjectTasks,
  type SortDirection,
  type TaskSortColumn,
} from "@/libs/taskSort";
import toast from "react-hot-toast";
import type { Task, ActionItem } from "@/types/database";

type Assignee = { task_id: string; profile_id: string };

const memberName = (members: OrgMember[], id: string): string => {
  const m = members.find((x) => x.id === id);
  return m ? memberDisplayLabel(m) : "Unknown";
};

// Tasks within a project (TSK-01..TSK-04) plus action-item checklists (TSK-02).
export default function TasksSection({
  projectId,
  orgId,
  members,
}: {
  projectId: string;
  orgId: string;
  members: OrgMember[];
}) {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New-task form.
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [status, setStatus] = useState<string>("not_started");
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [newAssignees, setNewAssignees] = useState<string[]>([]);

  // New action-item draft text, keyed by task id.
  const [actionDrafts, setActionDrafts] = useState<Record<string, string>>({});

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<TaskSortColumn>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadAll = useCallback(async () => {
    const { data: taskData, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("load tasks failed:", getErrorMessage(error), error);
      toast.error("Could not load tasks.");
      setIsLoading(false);
      return;
    }

    const loaded = (taskData as Task[]) ?? [];
    setTasks(loaded);

    const ids = loaded.map((t) => t.id);
    if (ids.length) {
      const [aRes, iRes] = await Promise.all([
        supabase
          .from("task_assignees")
          .select("task_id, profile_id")
          .in("task_id", ids),
        supabase
          .from("action_items")
          .select("*")
          .in("task_id", ids)
          .order("position", { ascending: true }),
      ]);
      setAssignees((aRes.data as Assignee[]) ?? []);
      setActionItems((iRes.data as ActionItem[]) ?? []);
    } else {
      setAssignees([]);
      setActionItems([]);
    }
    setIsLoading(false);
  }, [supabase, projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const taskAssignees = (taskId: string): string[] =>
    assignees.filter((a) => a.task_id === taskId).map((a) => a.profile_id);

  const hasActiveFilters = Boolean(statusFilter || assigneeFilter);

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (assigneeFilter && !taskAssignees(t.id).includes(assigneeFilter)) {
        return false;
      }
      return true;
    });

    return sortProjectTasks(
      filtered,
      sortColumn,
      sortDirection,
      members,
      taskAssignees
    );
  }, [
    tasks,
    assignees,
    members,
    statusFilter,
    assigneeFilter,
    sortColumn,
    sortDirection,
  ]);

  const clearFilters = () => {
    setStatusFilter("");
    setAssigneeFilter("");
  };

  // Distinct people across all tasks — the project's assigned members (PRJ-02).
  const projectPeople = Array.from(new Set(assignees.map((a) => a.profile_id)));

  const updateLocalTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const toggleNewAssignee = (profileId: string) =>
    setNewAssignees((prev) =>
      prev.includes(profileId)
        ? prev.filter((p) => p !== profileId)
        : [...prev, profileId]
    );

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          org_id: orgId,
          project_id: projectId,
          name: name.trim(),
          status,
          start_date: startDate || null,
          due_date: dueDate || null,
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
        setAssignees((prev) => [...prev, ...rows]);
      }

      setTasks((prev) => [...prev, created]);
      setName("");
      setStatus("not_started");
      setStartDate("");
      setDueDate("");
      setNewAssignees([]);
      setShowCreate(false);
      toast.success("Task added.");
    } catch (error) {
      console.error("create task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          name: task.name.trim(),
          status: task.status,
          start_date: task.start_date || null,
          due_date: task.due_date || null,
        })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Task saved.");
    } catch (error) {
      console.error("save task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.name}"?`)) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setAssignees((prev) => prev.filter((a) => a.task_id !== task.id));
      setActionItems((prev) => prev.filter((i) => i.task_id !== task.id));
      toast.success("Task deleted.");
    } catch (error) {
      console.error("delete task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const toggleTaskAssignee = async (taskId: string, profileId: string) => {
    const isAssigned = taskAssignees(taskId).includes(profileId);
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .eq("profile_id", profileId);
        if (error) throw error;
        setAssignees((prev) =>
          prev.filter(
            (a) => !(a.task_id === taskId && a.profile_id === profileId)
          )
        );
      } else {
        const { error } = await supabase
          .from("task_assignees")
          .insert({ task_id: taskId, profile_id: profileId });
        if (error) throw error;
        setAssignees((prev) => [
          ...prev,
          { task_id: taskId, profile_id: profileId },
        ]);
      }
    } catch (error) {
      console.error("toggle assignee failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const addActionItem = async (taskId: string) => {
    const title = (actionDrafts[taskId] ?? "").trim();
    if (!title) return;
    try {
      const position = actionItems.filter((i) => i.task_id === taskId).length;
      const { data, error } = await supabase
        .from("action_items")
        .insert({ task_id: taskId, title, position })
        .select()
        .single();
      if (error) throw error;
      setActionItems((prev) => [...prev, data as ActionItem]);
      setActionDrafts((prev) => ({ ...prev, [taskId]: "" }));
    } catch (error) {
      console.error("add action item failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const toggleActionItem = async (item: ActionItem) => {
    try {
      const { error } = await supabase
        .from("action_items")
        .update({ is_complete: !item.is_complete })
        .eq("id", item.id);
      if (error) throw error;
      setActionItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_complete: !i.is_complete } : i
        )
      );
    } catch (error) {
      console.error("toggle action item failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const deleteActionItem = async (item: ActionItem) => {
    try {
      const { error } = await supabase
        .from("action_items")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      setActionItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error("delete action item failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Tasks</h2>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Cancel" : "Add task"}
          </button>
        </div>

        {projectPeople.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className="text-base-content/60 mr-1">People:</span>
            {projectPeople.map((pid) => (
              <span key={pid} className="badge badge-ghost">
                {memberName(members, pid)}
              </span>
            ))}
          </div>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreateTask}
            className="space-y-3 border border-base-300 rounded-lg p-4 mt-2"
          >
            <div className="grid md:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text mb-1">Task name *</span>
                <input
                  required
                  type="text"
                  value={name}
                  className="input input-bordered"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">Status</span>
                <select
                  value={status}
                  className="select select-bordered"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text mb-1">Start date</span>
                <input
                  type="date"
                  value={startDate}
                  className="input input-bordered"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  className="input input-bordered"
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>
            {members.length > 0 && (
              <div>
                <span className="label-text">Assignees</span>
                <div className="flex flex-wrap gap-3 mt-1">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={newAssignees.includes(m.id)}
                        onChange={() => toggleNewAssignee(m.id)}
                      />
                      {memberDisplayLabel(m)}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSaving || !name.trim()}
              >
                {isSaving && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                Add task
              </button>
            </div>
          </form>
        )}

        <div className="divider my-2"></div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner"></span>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-base-content/60 py-2">
            No tasks yet. Add one to break this project down.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <p className="text-sm text-base-content/60 mr-auto">
                {hasActiveFilters
                  ? `${visibleTasks.length} of ${tasks.length} tasks`
                  : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
              </p>

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

              {members.length > 0 && (
                <label className="form-control">
                  <span className="label-text mb-1">Assignee</span>
                  <select
                    value={assigneeFilter}
                    className="select select-bordered select-sm"
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                  >
                    <option value="">All assignees</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {memberDisplayLabel(m)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

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
                    {PROJECT_TASK_SORT_COLUMNS.map((col) => (
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

            {visibleTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-base-300 px-4 py-8 text-center">
                <p className="text-sm font-medium text-base-content">
                  No tasks match your filters
                </p>
                <p className="mt-1 text-sm text-base-content/60">
                  Try changing the status or assignee filters.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-3"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleTasks.map((task) => {
              const expanded = expandedId === task.id;
              const items = actionItems.filter((i) => i.task_id === task.id);
              const doneCount = items.filter((i) => i.is_complete).length;
              const assigned = taskAssignees(task.id);
              return (
                <div
                  key={task.id}
                  className="border border-base-300 rounded-lg"
                >
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() =>
                      setExpandedId(expanded ? null : task.id)
                    }
                  >
                    <span
                      className={taskStatusBadgeClass(task.status)}
                    >
                      {taskStatusLabel(task.status)}
                    </span>
                    <span className="flex-1 font-medium">{task.name}</span>
                    {items.length > 0 && (
                      <span className="text-xs text-base-content/60">
                        {doneCount}/{items.length} done
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-base-content/60">
                        due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </button>

                  {expanded && (
                    <div className="border-t border-base-300 p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-3">
                        <label className="form-control">
                          <span className="label-text mb-1">Name</span>
                          <input
                            type="text"
                            value={task.name}
                            className="input input-bordered input-sm"
                            onChange={(e) =>
                              updateLocalTask(task.id, {
                                name: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text mb-1">Status</span>
                          <select
                            value={task.status}
                            className="select select-bordered select-sm"
                            onChange={(e) =>
                              updateLocalTask(task.id, {
                                status: e.target
                                  .value as Task["status"],
                              })
                            }
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-control">
                          <span className="label-text mb-1">Start date</span>
                          <input
                            type="date"
                            value={task.start_date ?? ""}
                            className="input input-bordered input-sm"
                            onChange={(e) =>
                              updateLocalTask(task.id, {
                                start_date: e.target.value || null,
                              })
                            }
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text mb-1">Due date</span>
                          <input
                            type="date"
                            value={task.due_date ?? ""}
                            className="input input-bordered input-sm"
                            onChange={(e) =>
                              updateLocalTask(task.id, {
                                due_date: e.target.value || null,
                              })
                            }
                          />
                        </label>
                      </div>

                      {members.length > 0 && (
                        <div>
                          <span className="label-text">Assignees</span>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {members.map((m) => (
                              <label
                                key={m.id}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-sm"
                                  checked={assigned.includes(m.id)}
                                  onChange={() =>
                                    toggleTaskAssignee(task.id, m.id)
                                  }
                                />
                                {memberDisplayLabel(m)}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action items (checklist subtasks) */}
                      <div>
                        <span className="label-text">Action items</span>
                        <ul className="space-y-1 mt-1">
                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={item.is_complete}
                                onChange={() => toggleActionItem(item)}
                              />
                              <span
                                className={`flex-1 text-sm ${
                                  item.is_complete
                                    ? "line-through text-base-content/50"
                                    : ""
                                }`}
                              >
                                {item.title}
                              </span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => deleteActionItem(item)}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={actionDrafts[task.id] ?? ""}
                            placeholder="Add an action item"
                            className="input input-bordered input-sm flex-1"
                            onChange={(e) =>
                              setActionDrafts((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addActionItem(task.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => addActionItem(task.id)}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => handleDeleteTask(task)}
                        >
                          Delete task
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveTask(task)}
                        >
                          Save task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
