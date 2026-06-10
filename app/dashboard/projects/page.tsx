import { getProfile } from "@/libs/supabase/getProfile";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

// Projects list + create (PRJ-01). The /dashboard layout guarantees an
// authenticated user with an org; we pass the org id to the client for inserts.
export default async function ProjectsPage() {
  const profile = await getProfile();
  if (!profile?.org_id) return null;

  return (
    <main className="min-h-screen p-6 pb-24 lg:p-8">
      <section className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Every project in your org, with owner, team, and target date.
          </p>
        </div>

        <ProjectsClient orgId={profile.org_id} />
      </section>
    </main>
  );
}
