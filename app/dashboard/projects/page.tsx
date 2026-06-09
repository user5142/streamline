import Link from "next/link";
import { getProfile } from "@/libs/supabase/getProfile";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

// Projects list + create (PRJ-01). The /dashboard layout guarantees an
// authenticated user with an org; we pass the org id to the client for inserts.
export default async function ProjectsPage() {
  const profile = await getProfile();
  if (!profile?.org_id) return null;

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-5xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="link link-hover text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Projects</h1>
        </div>

        <ProjectsClient orgId={profile.org_id} />
      </section>
    </main>
  );
}
