import { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import config from "@/config";
import JoinInvite from "./JoinInvite";

export const dynamic = "force-dynamic";

interface InvitePreview {
  valid: boolean;
  org_name: string | null;
  reason: string;
}

// Recipient landing page for an invite link. Lives outside /dashboard so that
// not-yet-signed-in visitors can reach it. Branches on token validity + the
// visitor's auth/org state. The actual join is delegated to <JoinInvite/>.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_invite_preview", {
    invite_token: token,
  });

  const preview: InvitePreview | undefined = Array.isArray(data)
    ? data[0]
    : data;

  const Shell = ({ children }: { children: ReactNode }) => (
    <main className="p-8 md:p-24" data-theme={config.colors.theme}>
      <div className="max-w-xl mx-auto text-center space-y-6">{children}</div>
    </main>
  );

  // Invalid / expired / used / lookup error.
  if (error || !preview?.valid) {
    const messages: Record<string, string> = {
      expired: "This invite link has expired. Ask an admin for a new one.",
      used: "This invite link has already been used.",
      not_found: "This invite link is not valid.",
    };
    const message =
      messages[preview?.reason ?? ""] ?? "This invite link is not valid.";

    return (
      <Shell>
        <h1 className="text-3xl font-extrabold">Invite unavailable</h1>
        <p className="text-base-content/70">{message}</p>
        <Link href="/" className="btn btn-ghost btn-sm">
          Go home
        </Link>
      </Shell>
    );
  }

  const orgName = preview.org_name ?? "the organization";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → route through sign-in, returning here afterward.
  if (!user) {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold">
          You&apos;re invited to join {orgName}
        </h1>
        <p className="text-base-content/70">
          Sign in or create an account to accept this invitation.
        </p>
        <Link
          href={`${config.auth.loginUrl}?mode=signup&next=/invite/${token}`}
          className="btn btn-primary"
        >
          Continue
        </Link>
      </Shell>
    );
  }

  // Signed in but already in an org → can't join another (single-org model).
  const profile = await getProfile();
  if (profile?.org_id) {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold">Already a member</h1>
        <p className="text-base-content/70">
          You already belong to an organization, so this invite can&apos;t be
          used on your account.
        </p>
        <Link href={config.auth.callbackUrl} className="btn btn-primary">
          Go to dashboard
        </Link>
      </Shell>
    );
  }

  // Signed in, no org yet → show the join form.
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold">Join {orgName}</h1>
      <p className="text-base-content/70">
        Confirm your name to join this organization.
      </p>
      <JoinInvite token={token} orgName={orgName} />
    </Shell>
  );
}
