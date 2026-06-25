"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
  projectStatusBadgeClass,
} from "@/libs/status";
import toast from "react-hot-toast";
import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import type { Project, Team } from "@/types/database";

// Editable project detail. The project's assigned members (PRJ-02) are derived
// from task assignees and shown in the Tasks section (rendered below this form
// on the project page) as the "People" list.
export default function ProjectDetailClient({
  project,
  teams,
  members,
}: {
  project: Project;
  teams: Team[];
  members: OrgMember[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState<string>(project.name);
  const [description, setDescription] = useState<string>(
    project.description ?? ""
  );
  const [ownerId, setOwnerId] = useState<string>(project.owner_id ?? "");
  const [teamId, setTeamId] = useState<string>(project.team_id ?? "");
  const [status, setStatus] = useState<string>(project.status);
  const [startDate, setStartDate] = useState<string>(project.start_date ?? "");
  const [targetDate, setTargetDate] = useState<string>(
    project.target_completion_date ?? ""
  );
  const [actualDate, setActualDate] = useState<string>(
    project.actual_completion_date ?? ""
  );
  const [budget, setBudget] = useState<string>(
    project.budget != null ? String(project.budget) : ""
  );
  const [showOnGantt, setShowOnGantt] = useState<boolean>(
    project.show_on_gantt
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus);
    if (nextStatus === "complete" && !actualDate) {
      setActualDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        owner_id: ownerId || null,
        team_id: teamId || null,
        status,
        start_date: startDate || null,
        target_completion_date: targetDate || null,
        actual_completion_date: actualDate || null,
        budget: budget ? Number(budget) : null,
        show_on_gantt: showOnGantt,
      };
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id);
      if (error) throw error;

      toast.success("Project saved.");
      router.refresh();
    } catch (error) {
      console.error("save project failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);
      if (error) throw error;

      toast.success("Project deleted.");
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("delete project failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          {/* Inline-editable title: reads as a heading, reveals its field on
              hover/focus rather than sitting in a permanent input box. */}
          <input
            required
            type="text"
            value={name}
            aria-label="Project name"
            className="font-display text-3xl font-bold flex-1 -mx-2 rounded-lg border border-transparent bg-transparent px-2 py-1 transition-colors hover:border-base-300 focus:border-primary focus:bg-base-100 focus:outline-none"
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
        <div className="mt-2 px-0">
          <span className={projectStatusBadgeClass(status)}>
            {projectStatusLabel(status)}
          </span>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body grid md:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label-text mb-1">Status</span>
            <select
              value={status}
              className="select select-bordered"
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Owner</span>
            <select
              value={ownerId}
              className="select select-bordered"
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">— None —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberDisplayLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Team</span>
            <select
              value={teamId}
              className="select select-bordered"
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="">— None —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Budget</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              className="input input-bordered"
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Start Date</span>
            <input
              type="date"
              value={startDate}
              className="input input-bordered"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Target Completion</span>
            <input
              type="date"
              value={targetDate}
              className="input input-bordered"
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Actual Completion</span>
            <input
              type="date"
              value={actualDate}
              className="input input-bordered w-full"
              onChange={(e) => setActualDate(e.target.value)}
            />
            <p className="mt-1 text-sm text-base-content/50">
              Set when the project is finished.
            </p>
          </label>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="label-text font-medium">
                Track on Gantt timeline
              </span>
              <span className="block text-sm text-base-content/60">
                {showOnGantt
                  ? "This project appears on the company-wide Gantt chart."
                  : "This project is hidden from the Gantt chart."}
              </span>
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={showOnGantt}
              onChange={(e) => setShowOnGantt(e.target.checked)}
            />
          </label>
        </div>
      </div>

      <label className="form-control flex w-full flex-col">
        <span className="label-text mb-1">Description</span>
        <textarea
          value={description}
          className="textarea textarea-bordered w-full"
          rows={4}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving || !name.trim()}
        >
          {isSaving && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          Save changes
        </button>
      </div>
    </form>
  );
}
