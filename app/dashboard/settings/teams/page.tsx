import Link from "next/link";
import { getProfile } from "@/libs/supabase/getProfile";
import TeamsManager from "./TeamsManager";

export const dynamic = "force-dynamic";

// Team management (TM-01, TM-02, TM-04). The settings layout already guarantees
// an authenticated admin with an org; we pass the org id to the client manager
// so it can scope inserts.
export default async function TeamsPage() {
  const profile = await getProfile();

  // Layout guarantees this, but keep the type narrow.
  if (!profile?.org_id) return null;

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard/settings" className="link link-hover text-sm">
            ← Settings
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Teams</h1>
          <p className="text-sm text-base-content/70 mt-1">
            Create teams and manage who belongs to them. Projects are assigned
            to a team.
          </p>
        </div>

        <TeamsManager orgId={profile.org_id} />
      </section>
    </main>
  );
}
