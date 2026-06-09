"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import toast from "react-hot-toast";
import type { Team } from "@/types/database";

type OrgMember = { id: string; full_name: string | null; email: string | null };
type Membership = { team_id: string; profile_id: string };

const memberLabel = (m: OrgMember): string =>
  m.full_name || m.email || "Unknown user";

export default function TeamsManager({ orgId }: { orgId: string }) {
  const supabase = createClient();

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [renameValue, setRenameValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const loadAll = useCallback(async () => {
    const [teamsRes, membersRes, mRes] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name"),
      supabase.from("team_members").select("team_id, profile_id"),
    ]);

    if (teamsRes.error || membersRes.error || mRes.error) {
      const err = teamsRes.error || membersRes.error || mRes.error;
      console.error("load teams failed:", getErrorMessage(err), err);
      toast.error("Could not load teams.");
    } else {
      setTeams((teamsRes.data as Team[]) ?? []);
      setMembers((membersRes.data as OrgMember[]) ?? []);
      setMemberships((mRes.data as Membership[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  const isMemberOfSelected = (profileId: string): boolean =>
    !!selectedTeamId &&
    memberships.some(
      (m) => m.team_id === selectedTeamId && m.profile_id === profileId
    );

  const selectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setRenameValue(team.name);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert({ org_id: orgId, name: newTeamName.trim() })
        .select()
        .single();
      if (error) throw error;

      const created = data as Team;
      setTeams((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTeamName("");
      selectTeam(created);
      toast.success(`Team "${created.name}" created.`);
    } catch (error) {
      console.error("create team failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!selectedTeam || !renameValue.trim()) return;
    if (renameValue.trim() === selectedTeam.name) return;
    try {
      const { error } = await supabase
        .from("teams")
        .update({ name: renameValue.trim() })
        .eq("id", selectedTeam.id);
      if (error) throw error;

      setTeams((prev) =>
        prev
          .map((t) =>
            t.id === selectedTeam.id ? { ...t, name: renameValue.trim() } : t
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Team renamed.");
    } catch (error) {
      console.error("rename team failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (team: Team) => {
    if (
      !window.confirm(
        `Delete team "${team.name}"? Projects assigned to it will become unassigned.`
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", team.id);
      if (error) throw error;

      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      setMemberships((prev) => prev.filter((m) => m.team_id !== team.id));
      if (selectedTeamId === team.id) setSelectedTeamId(null);
      toast.success("Team deleted.");
    } catch (error) {
      console.error("delete team failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const toggleMembership = async (profileId: string) => {
    if (!selectedTeamId) return;
    const currentlyMember = isMemberOfSelected(profileId);
    try {
      if (currentlyMember) {
        const { error } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", selectedTeamId)
          .eq("profile_id", profileId);
        if (error) throw error;
        setMemberships((prev) =>
          prev.filter(
            (m) =>
              !(m.team_id === selectedTeamId && m.profile_id === profileId)
          )
        );
      } else {
        const { error } = await supabase
          .from("team_members")
          .insert({ team_id: selectedTeamId, profile_id: profileId });
        if (error) throw error;
        setMemberships((prev) => [
          ...prev,
          { team_id: selectedTeamId, profile_id: profileId },
        ]);
      }
    } catch (error) {
      console.error("toggle membership failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
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
    <div className="grid md:grid-cols-2 gap-6">
      {/* Teams list + create */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Teams</h2>

          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              placeholder="New team name"
              className="input input-bordered flex-1"
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !newTeamName.trim()}
            >
              {isCreating && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              Add
            </button>
          </form>

          <div className="divider my-2"></div>

          {teams.length === 0 ? (
            <p className="text-sm text-base-content/60 py-2">
              No teams yet. Create one above.
            </p>
          ) : (
            <ul className="menu px-0">
              {teams.map((team) => {
                const count = memberships.filter(
                  (m) => m.team_id === team.id
                ).length;
                return (
                  <li key={team.id}>
                    <button
                      className={selectedTeamId === team.id ? "active" : ""}
                      onClick={() => selectTeam(team)}
                    >
                      <span className="flex-1 text-left">{team.name}</span>
                      <span className="badge badge-ghost badge-sm">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Selected team detail: rename, delete, membership */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          {!selectedTeam ? (
            <p className="text-sm text-base-content/60">
              Select a team to manage its name and members.
            </p>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <label className="form-control flex-1">
                  <span className="label-text mb-1">Team name</span>
                  <input
                    type="text"
                    value={renameValue}
                    className="input input-bordered w-full"
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRename}
                  />
                </label>
                <button
                  className="btn btn-ghost text-error"
                  onClick={() => handleDelete(selectedTeam)}
                >
                  Delete
                </button>
              </div>

              <div className="divider my-2">Members</div>

              {members.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  No members in your organization yet.
                </p>
              ) : (
                <ul className="space-y-1 max-h-80 overflow-y-auto">
                  {members.map((m) => (
                    <li key={m.id}>
                      <label className="flex items-center gap-3 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={isMemberOfSelected(m.id)}
                          onChange={() => toggleMembership(m.id)}
                        />
                        <span className="text-sm">{memberLabel(m)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
