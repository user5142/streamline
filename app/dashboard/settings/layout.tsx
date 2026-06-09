import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getProfile } from "@/libs/supabase/getProfile";
import config from "@/config";

// Admin-only area. The parent /dashboard layout already guarantees an
// authenticated user with an org; this adds the admin role check. Non-admins
// are bounced back to the dashboard.
//
// This shell also hosts Team management (TM-04) in Chunk 4.
export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();

  if (profile?.role !== "admin") {
    redirect(config.auth.callbackUrl);
  }

  return <>{children}</>;
}
