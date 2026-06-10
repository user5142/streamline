"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import {
  memberDisplayLabel,
  memberLabel,
  type OrgMember,
} from "@/libs/orgMember";
import toast from "react-hot-toast";
import type { Team } from "@/types/database";

type Membership = { team_id: string; profile_id: string };

export default function TeamsManager({ orgId }: { orgId: string }) {
  const supabase = createClient();

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [renameValue, setRenameValue] = useState<string>("");
  const [externalName, setExternalName] = useState<string>("");
  const [externalEmail, setExternalEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isAddingExternal, setIsAddingExternal] = useState<boolean>(false);

  const loadAll = useCallback(async () => {
    const [teamsRes, membersRes, mRes] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, is_external")
        .order("full_name"),
      supabase.from("team_members").select("team_id, profile_id"),
    ]);

    if (teamsRes.error || membersRes.error || mRes.error) {
      const err = teamsRes.error || membersRes.error || mRes.error;
      console.error("load teams failed:", getErrorMessage(err), err);
      toast.error("Could not load teams.");
    } else {
      setTeams((teamsRes.data as Team[]) ?? []);
      setMembers(
        ((membersRes.data as OrgMember[]) ?? []).map((m) => ({
          ...m,
          is_external: m.is_external ?? false,
        }))
      );
      setMemberships((mRes.data as Membership[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  const accountMembers = members.filter((m) => !m.is_external);
  const externalMembers = members.filter((m) => m.is_external);

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

  const handleAddExternal = async (e: FormEvent) => {
    e.preventDefault();
    if (!externalName.trim()) return;
    setIsAddingExternal(true);
    try {
      const { data, error } = await supabase.rpc("create_external_member", {
        p_full_name: externalName.trim(),
        p_email: externalEmail.trim() || null,
      });
      if (error) throw error;

      const created = data as OrgMember;
      const withFlag = { ...created, is_external: true };
      setMembers((prev) =>
        [...prev, withFlag].sort((a, b) =>
          memberLabel(a).localeCompare(memberLabel(b))
        )
      );
      setExternalName("");
      setExternalEmail("");

      if (selectedTeamId) {
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({ team_id: selectedTeamId, profile_id: created.id });
        if (memberError) throw memberError;
        setMemberships((prev) => [
          ...prev,
          { team_id: selectedTeamId, profile_id: created.id },
        ]);
      }

      toast.success(
        selectedTeam
          ? `"${memberLabel(withFlag)}" added and assigned to ${selectedTeam.name}.`
          : `"${memberLabel(withFlag)}" added to your organization.`
      );
    } catch (error) {
      console.error("add external member failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsAddingExternal(false);
    }
  };

  const handleDeleteExternal = async (member: OrgMember) => {
    if (
      !window.confirm(
        `Remove "${memberLabel(member)}"? They will be removed from all teams and task assignments.`
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase.rpc("delete_external_member", {
        p_profile_id: member.id,
      });
      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setMemberships((prev) => prev.filter((m) => m.profile_id !== member.id));
      toast.success("External member removed.");
    } catch (error) {
      console.error("delete external member failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    }
  };

  const renderMemberRow = (m: OrgMember, showDelete: boolean) => (
    <li key={m.id} className="flex items-center gap-3 py-1">
      <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
        <input
          type="checkbox"
          className="checkbox checkbox-sm shrink-0"
          checked={isMemberOfSelected(m.id)}
          disabled={!selectedTeamId}
          onChange={() => toggleMembership(m.id)}
        />
        <span className="text-sm truncate">{memberDisplayLabel(m)}</span>
      </label>
      {showDelete && (
        <button
          type="button"
          className="btn btn-ghost btn-xs text-error shrink-0"
          onClick={() => handleDeleteExternal(m)}
          aria-label={`Remove ${memberLabel(m)}`}
        >
          Remove
        </button>
      )}
    </li>
  );

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

              <div className="divider my-2">Members with accounts</div>
              <p className="text-xs text-base-content/60 -mt-2 mb-2">
                Teammates who have signed up and joined your organization.
              </p>

              {accountMembers.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  No signed-in members yet. Invite teammates from Settings, or
                  add external members below.
                </p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {accountMembers.map((m) => renderMemberRow(m, false))}
                </ul>
              )}

              <div className="divider my-2">External members</div>
              <p className="text-xs text-base-content/60 -mt-2 mb-3">
                Add vendors, partners, or others who are not using Streamline.
                They can be assigned to projects and tasks but cannot sign in.
                {selectedTeam
                  ? ` New external members are added to ${selectedTeam.name} automatically.`
                  : ""}
              </p>

              <form onSubmit={handleAddExternal} className="flex flex-wrap gap-2 mb-4">
                <input
                  type="text"
                  value={externalName}
                  placeholder="Name *"
                  className="input input-bordered input-sm flex-1 min-w-[8rem]"
                  onChange={(e) => setExternalName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  value={externalEmail}
                  placeholder="Email (optional)"
                  className="input input-bordered input-sm flex-1 min-w-[8rem]"
                  onChange={(e) => setExternalEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isAddingExternal || !externalName.trim()}
                >
                  {isAddingExternal && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  Add external
                </button>
              </form>

              {externalMembers.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  No external members yet.
                </p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {externalMembers.map((m) => renderMemberRow(m, true))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
