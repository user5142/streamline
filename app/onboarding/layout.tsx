import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import config from "@/config";

// Gate for onboarding:
//  - Not signed in        → /signin
//  - Already has an org    → /dashboard (can't re-onboard)
//  - Signed in, no org yet → render the onboarding form
export default async function OnboardingLayout({
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

  if (profile?.org_id) {
    redirect(config.auth.callbackUrl);
  }

  return <>{children}</>;
}
