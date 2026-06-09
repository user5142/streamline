"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import { PROJECT_STATUSES } from "@/libs/status";
import toast from "react-hot-toast";
import type { Project, Team } from "@/types/database";

type OrgMember = { id: string; full_name: string | null; email: string | null };

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
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
      <div className="flex items-start justify-between gap-4">
        <input
          required
          type="text"
          value={name}
          className="input input-bordered text-2xl font-extrabold flex-1"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-ghost text-error"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body grid md:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label-text mb-1">Status</span>
            <select
              value={status}
              className="select select-bordered"
              onChange={(e) => setStatus(e.target.value)}
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
                  {m.full_name || m.email || "Unknown"}
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
            <span className="label-text mb-1">Start date</span>
            <input
              type="date"
              value={startDate}
              className="input input-bordered"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Target completion</span>
            <input
              type="date"
              value={targetDate}
              className="input input-bordered"
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Actual completion</span>
            <input
              type="date"
              value={actualDate}
              className="input input-bordered"
              onChange={(e) => setActualDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <label className="form-control">
        <span className="label-text mb-1">Description</span>
        <textarea
          value={description}
          className="textarea textarea-bordered"
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
