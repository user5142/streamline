"use client";

import { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import Link from "next/link";
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

type SortColumn =
  | "name"
  | "team"
  | "owner"
  | "status"
  | "start_date"
  | "target"
  | "actual";
type SortDirection = "asc" | "desc";

const STATUS_SORT_ORDER = new Map(
  PROJECT_STATUSES.map((s, i) => [s.value, i])
);

function compareStrings(a: string, b: string, dir: number): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" }) * dir;
}

function compareDates(
  a: string | null,
  b: string | null,
  dir: number
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return (new Date(a).getTime() - new Date(b).getTime()) * dir;
}

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

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadAll = useCallback(async () => {
    const [p, t, m] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, is_external")
        .order("full_name"),
    ]);

    if (p.error || t.error || m.error) {
      const err = p.error || t.error || m.error;
      console.error("load projects failed:", getErrorMessage(err), err);
      toast.error("Could not load projects.");
    } else {
      setProjects((p.data as Project[]) ?? []);
      setTeams((t.data as Team[]) ?? []);
      setMembers(
        ((m.data as OrgMember[]) ?? []).map((member) => ({
          ...member,
          is_external: member.is_external ?? false,
        }))
      );
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
    return m ? memberDisplayLabel(m) : "—";
  };

  const hasActiveFilters = Boolean(teamFilter || ownerFilter || statusFilter);

  const visibleProjects = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;

    const filtered = projects.filter((p) => {
      if (teamFilter && p.team_id !== teamFilter) return false;
      if (ownerFilter && p.owner_id !== ownerFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case "name":
          return compareStrings(a.name, b.name, dir);
        case "team":
          return compareStrings(teamName(a.team_id), teamName(b.team_id), dir);
        case "owner":
          return compareStrings(
            memberName(a.owner_id),
            memberName(b.owner_id),
            dir
          );
        case "status": {
          const aOrder = STATUS_SORT_ORDER.get(a.status) ?? 999;
          const bOrder = STATUS_SORT_ORDER.get(b.status) ?? 999;
          return (aOrder - bOrder) * dir;
        }
        case "start_date":
          return compareDates(a.start_date, b.start_date, dir);
        case "target":
          return compareDates(
            a.target_completion_date,
            b.target_completion_date,
            dir
          );
        case "actual":
          return compareDates(
            a.actual_completion_date,
            b.actual_completion_date,
            dir
          );
        default:
          return 0;
      }
    });
  }, [
    projects,
    teamFilter,
    ownerFilter,
    statusFilter,
    sortColumn,
    sortDirection,
    teams,
    members,
  ]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setTeamFilter("");
    setOwnerFilter("");
    setStatusFilter("");
  };

  const SortHeader = ({
    column,
    label,
  }: {
    column: SortColumn;
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? `${visibleProjects.length} of ${projects.length} projects`
            : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? (
            "Cancel"
          ) : (
            <>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              New project
            </>
          )}
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
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-base-content">
            No projects yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
            Create your first project to start tracking work on the timeline.
          </p>
          <button
            className="btn btn-primary mt-5"
            onClick={() => setShowCreate(true)}
          >
            New project
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-base-content">
            No projects match your filters
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
            Try changing the team, owner, or status filters.
          </p>
          <button className="btn btn-ghost mt-5" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
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
              <span className="label-text mb-1">Owner</span>
              <select
                value={ownerFilter}
                className="select select-bordered select-sm"
                onChange={(e) => setOwnerFilter(e.target.value)}
              >
                <option value="">All owners</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberDisplayLabel(m)}
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
                {PROJECT_STATUSES.map((s) => (
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
                  <SortHeader column="name" label="Name" />
                  <SortHeader column="team" label="Team" />
                  <SortHeader column="owner" label="Owner" />
                  <SortHeader column="status" label="Status" />
                  <SortHeader column="start_date" label="Start Date" />
                  <SortHeader column="target" label="Target" />
                  <SortHeader column="actual" label="Actual" />
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((p) => (
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
                      className={projectStatusBadgeClass(p.status)}
                    >
                      {projectStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="text-sm">
                    {p.start_date
                      ? new Date(p.start_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="text-sm">
                    {p.target_completion_date
                      ? new Date(
                          p.target_completion_date
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="text-sm">
                    {p.actual_completion_date
                      ? new Date(
                          p.actual_completion_date
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
