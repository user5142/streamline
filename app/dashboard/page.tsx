import Link from "next/link";
import ButtonAccount from "@/components/ButtonAccount";
import { getProfile } from "@/libs/supabase/getProfile";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <ButtonAccount />
          <div className="flex items-center gap-2">
            <Link href="/dashboard/gantt" className="btn btn-sm btn-primary">
              Gantt
            </Link>
            <Link href="/dashboard/projects" className="btn btn-sm">
              Projects
            </Link>
            <Link href="/dashboard/my-tasks" className="btn btn-sm btn-ghost">
              My tasks
            </Link>
            {isAdmin && (
              <Link href="/dashboard/settings" className="btn btn-sm btn-ghost">
                Settings
              </Link>
            )}
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
        <p className="text-base-content/70">
          Jump into the company-wide Gantt, manage your projects, or review the
          tasks assigned to you.
        </p>
      </section>
    </main>
  );
}
