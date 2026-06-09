"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import config from "@/config";

// Onboarding step shown to a signed-in user who doesn't belong to an org yet.
//
// "Create an organization" is fully wired here: it calls the
// create_organization RPC, which creates the org, auto-generates a unique slug,
// and promotes the caller to admin (see supabase/migrations/0006_onboarding.sql).
//
// "Join with an invite link" is intentionally a placeholder — the redeem_invite
// RPC and token handling land in Chunk 3.
export default function Onboarding() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateOrg = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.rpc("create_organization", {
        org_name: orgName,
        full_name: fullName,
      });

      if (error) throw error;

      toast.success("Organization created!");
      router.push(config.auth.callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not create organization."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8 md:p-24" data-theme={config.colors.theme}>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-4">
        Welcome to {config.appName}
      </h1>
      <p className="text-center text-base-content/70 mb-12">
        Set up your organization to get started.
      </p>

      <div className="space-y-10 max-w-xl mx-auto">
        <form className="form-control w-full space-y-4" onSubmit={handleCreateOrg}>
          <label className="form-control w-full">
            <span className="label-text mb-1">Your name</span>
            <input
              required
              type="text"
              value={fullName}
              autoComplete="name"
              placeholder="Jane Doe"
              className="input input-bordered w-full placeholder:opacity-60"
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Organization name</span>
            <input
              required
              type="text"
              value={orgName}
              placeholder="Acme Corp"
              className="input input-bordered w-full placeholder:opacity-60"
              onChange={(e) => setOrgName(e.target.value)}
            />
          </label>

          <button
            className="btn btn-primary btn-block"
            disabled={isLoading}
            type="submit"
          >
            {isLoading && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            Create organization
          </button>
        </form>

        {/* Join-by-invite — wired up in Chunk 3 (redeem_invite RPC). */}
        <div className="divider text-xs text-base-content/50 font-medium">
          OR
        </div>
        <div className="text-center text-sm text-base-content/60">
          Have an invite link? Joining an existing organization by invite is
          coming soon.
        </div>
      </div>
    </main>
  );
}
