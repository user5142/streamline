import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import config from "@/config";
import DashboardSidebar from "@/components/DashboardSidebar";

// Server-side gate for all /dashboard subpages:
//  1. Not signed in            → /signin
//  2. Signed in but no org yet → /onboarding (create or join an org)
//  3. Otherwise                → render
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  const profile = await getProfile();

  if (!profile?.org_id) {
    redirect("/onboarding");
  }

  const isAdmin = profile?.role === "admin";

  // Responsive shell: the sidebar is pinned open on lg+ screens and slides in
  // as a drawer on smaller ones (toggled by the hamburger in drawer-content).
  return (
    <div className="drawer lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        {/* Mobile top bar — hidden once the sidebar is pinned on lg+ */}
        <div className="lg:hidden flex items-center gap-2 h-14 px-4 border-b border-base-300 bg-base-100 sticky top-0 z-10">
          <label
            htmlFor="dashboard-drawer"
            aria-label="Open navigation"
            className="btn btn-square btn-ghost btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </label>
          <span className="font-display font-bold">{config.appName}</span>
        </div>

        {children}
      </div>

      <div className="drawer-side z-20">
        <label
          htmlFor="dashboard-drawer"
          aria-label="Close navigation"
          className="drawer-overlay"
        ></label>
        <DashboardSidebar isAdmin={isAdmin} />
      </div>
    </div>
  );
}
