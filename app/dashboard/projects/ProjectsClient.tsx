"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
  projectStatusBadgeClass,
} from "@/libs/status";
import toast from "react-hot-toast";
import type { Project, Team } from "@/types/database";

type OrgMember = { id: string; full_name: string | null; email: string | null };

export default function ProjectsClient({ orgId }: { orgId: string }) {
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Create form fields.
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [status, setStatus] = useState<string>("not_started");

  const loadAll = useCallback(async () => {
    const [p, t, m] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name"),
    ]);

    if (p.error || t.error || m.error) {
      const err = p.error || t.error || m.error;
      console.error("load projects failed:", getErrorMessage(err), err);
      toast.error("Could not load projects.");
    } else {
      setProjects((p.data as Project[]) ?? []);
      setTeams((t.data as Team[]) ?? []);
      setMembers((m.data as OrgMember[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const teamName = (id: string | null): string =>
    (id && teams.find((t) => t.id === id)?.name) || "—";

  const memberName = (id: string | null): string => {
    if (!id) return "—";
    const m = members.find((x) => x.id === id);
    return m ? m.full_name || m.email || "Unknown" : "—";
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setOwnerId("");
    setTeamId("");
    setStartDate("");
    setTargetDate("");
    setBudget("");
    setStatus("not_started");
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        org_id: orgId,
        name: name.trim(),
        description: description.trim() || null,
        owner_id: ownerId || null,
        team_id: teamId || null,
        start_date: startDate || null,
        target_completion_date: targetDate || null,
        budget: budget ? Number(budget) : null,
        status,
      };
      const { data, error } = await supabase
        .from("projects")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      setProjects((prev) => [data as Project, ...prev]);
      resetForm();
      setShowCreate(false);
      toast.success("Project created.");
    } catch (error) {
      console.error("create project failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Cancel" : "New project"}
        </button>
      </div>

      {showCreate && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">New project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="form-control">
                  <span className="label-text mb-1">Name *</span>
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
              </div>
              <label className="form-control">
                <span className="label-text mb-1">Description</span>
                <textarea
                  value={description}
                  className="textarea textarea-bordered"
                  rows={3}
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
                  Create project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-base-content/60 py-6 text-center">
          No projects yet. Create your first one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="hover">
                  <td>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="link link-hover font-medium"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="text-sm">{teamName(p.team_id)}</td>
                  <td className="text-sm">{memberName(p.owner_id)}</td>
                  <td>
                    <span
                      className={`badge ${projectStatusBadgeClass(p.status)}`}
                    >
                      {projectStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="text-sm">
                    {p.target_completion_date
                      ? new Date(
                          p.target_completion_date
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
