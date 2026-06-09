"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import toast from "react-hot-toast";
import type { Invite } from "@/types/database";

// Admin settings — invite management (INV-01, INV-04). Generate a link, copy
// it to share manually, and revoke outstanding invites.
export default function SettingsPage() {
  const supabase = createClient();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const loadInvites = useCallback(async () => {
    const { data, error } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("load invites failed:", getErrorMessage(error), error);
      toast.error("Could not load invites.");
    } else {
      setInvites((data as Invite[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const inviteUrl = (token: string): string =>
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${token}`
      : `/invite/${token}`;

  const status = (invite: Invite): "Used" | "Expired" | "Active" => {
    if (invite.used_at) return "Used";
    if (new Date(invite.expires_at) <= new Date()) return "Expired";
    return "Active";
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc("create_invite");
      if (error) throw error;

      const created = data as Invite;
      try {
        await navigator.clipboard.writeText(inviteUrl(created.token));
      } catch {
        // Clipboard may be unavailable (e.g. insecure context); not fatal.
      }
      toast.success("Invite link created and copied to clipboard.");
      await loadInvites();
    } catch (error) {
      console.error("create_invite failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) {
      console.error("revoke invite failed:", getErrorMessage(error), error);
      toast.error("Could not revoke invite.");
    } else {
      toast.success("Invite revoked.");
      setInvites((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Settings</h1>
          </div>
          <Link href="/dashboard/settings/teams" className="btn btn-sm">
            Manage teams
          </Link>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="card-title">Invite teammates</h2>
                <p className="text-sm text-base-content/70">
                  Generate a link, then share it via Slack, email, or any
                  channel. Links expire after 7 days and can be used once.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                Generate invite link
              </button>
            </div>

            <div className="divider my-2"></div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner"></span>
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-base-content/60 py-4">
                No invites yet. Generate one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Expires</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => {
                      const s = status(invite);
                      const isActive = s === "Active";
                      return (
                        <tr key={invite.id}>
                          <td>
                            <span
                              className={`badge ${
                                isActive
                                  ? "badge-success"
                                  : "badge-ghost"
                              }`}
                            >
                              {s}
                            </span>
                          </td>
                          <td className="text-sm">
                            {new Date(
                              invite.expires_at
                            ).toLocaleDateString()}
                          </td>
                          <td className="text-right space-x-2">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleCopy(invite.token)}
                              disabled={!isActive}
                            >
                              Copy link
                            </button>
                            <button
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => handleRevoke(invite.id)}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
