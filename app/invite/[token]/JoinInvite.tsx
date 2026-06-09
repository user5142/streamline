"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import config from "@/config";

// Join action for a valid invite, shown to a signed-in user with no org.
// Calls redeem_invite, which sets org_id/role and marks the token used.
export default function JoinInvite({
  token,
  orgName,
}: {
  token: string;
  orgName: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.rpc("redeem_invite", {
        invite_token: token,
        full_name: fullName,
      });

      if (error) throw error;

      toast.success(`Joined ${orgName}!`);
      router.push(config.auth.callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not join organization."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="form-control w-full space-y-4 text-left"
      onSubmit={handleJoin}
    >
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

      <button
        className="btn btn-primary btn-block"
        disabled={isLoading}
        type="submit"
      >
        {isLoading && (
          <span className="loading loading-spinner loading-xs"></span>
        )}
        Join {orgName}
      </button>
    </form>
  );
}
