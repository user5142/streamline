"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import { TASK_STATUSES, taskStatusBadgeClass, taskStatusLabel } from "@/libs/status";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import toast from "react-hot-toast";
import type { ActionItem, Task } from "@/types/database";

type Assignee = { task_id: string; profile_id: string };

export default function TaskDetailClient({
  task: initialTask,
  project,
  members,
  initialAssignees,
  initialActionItems,
}: {
  task: Task;
  project: { id: string; name: string };
  members: OrgMember[];
  initialAssignees: Assignee[];
  initialActionItems: ActionItem[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [task, setTask] = useState<Task>(initialTask);
  const [assignees, setAssignees] = useState<Assignee[]>(initialAssignees);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
  const [actionDraft, setActionDraft] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const assignedIds = assignees.map((a) => a.profile_id);

  const updateTask = (patch: Partial<Task>) =>
    setTask((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!task.name.trim()) return;
    setIsSaving(true);
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
      router.refresh();
    } catch (error) {
      console.error("save task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.name}"?`)) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
      toast.success("Task deleted.");
      router.push("/dashboard/my-tasks");
    } catch (error) {
      console.error("delete task failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const toggleAssignee = async (profileId: string) => {
    const isAssigned = assignedIds.includes(profileId);
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", task.id)
          .eq("profile_id", profileId);
        if (error) throw error;
        setAssignees((prev) =>
          prev.filter(
            (a) => !(a.task_id === task.id && a.profile_id === profileId)
          )
        );
      } else {
        const { error } = await supabase
          .from("task_assignees")
          .insert({ task_id: task.id, profile_id: profileId });
        if (error) throw error;
        setAssignees((prev) => [
          ...prev,
          { task_id: task.id, profile_id: profileId },
        ]);
      }
    } catch (error) {
      console.error("toggle assignee failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const addActionItem = async () => {
    const title = actionDraft.trim();
    if (!title) return;
    try {
      const position = actionItems.length;
      const { data, error } = await supabase
        .from("action_items")
        .insert({ task_id: task.id, title, position })
        .select()
        .single();
      if (error) throw error;
      setActionItems((prev) => [...prev, data as ActionItem]);
      setActionDraft("");
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
      <div className="card-body space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={taskStatusBadgeClass(task.status)}>
            {taskStatusLabel(task.status)}
          </span>
          <span className="text-sm text-base-content/60">
            in{" "}
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="link link-hover"
            >
              {project.name}
            </Link>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="form-control md:col-span-2">
            <span className="label-text mb-1">Name</span>
            <input
              type="text"
              value={task.name}
              className="input input-bordered"
              onChange={(e) => updateTask({ name: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Status</span>
            <select
              value={task.status}
              className="select select-bordered"
              onChange={(e) =>
                updateTask({ status: e.target.value as Task["status"] })
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
            <span className="label-text mb-1">Due date</span>
            <input
              type="date"
              value={task.due_date ?? ""}
              className="input input-bordered"
              onChange={(e) =>
                updateTask({ due_date: e.target.value || null })
              }
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Start date</span>
            <input
              type="date"
              value={task.start_date ?? ""}
              className="input input-bordered"
              onChange={(e) =>
                updateTask({ start_date: e.target.value || null })
              }
            />
          </label>
        </div>

        {members.length > 0 && (
          <div>
            <span className="label-text">Assignees</span>
            <div className="flex flex-wrap gap-3 mt-2">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={assignedIds.includes(m.id)}
                    onChange={() => toggleAssignee(m.id)}
                  />
                  {memberDisplayLabel(m)}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label-text">Action items</span>
          <ul className="space-y-1 mt-2">
            {actionItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
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
              value={actionDraft}
              placeholder="Add an action item"
              className="input input-bordered input-sm flex-1"
              onChange={(e) => setActionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addActionItem();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={addActionItem}
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            className="btn btn-ghost text-error"
            onClick={handleDelete}
          >
            Delete task
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSaving || !task.name.trim()}
            onClick={handleSave}
          >
            {isSaving && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            Save task
          </button>
        </div>
      </div>
    </div>
  );
}
