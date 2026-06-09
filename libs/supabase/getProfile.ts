import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/database";

// Server-side helper to load the current user's profile (role, org_id, name).
// Returns null if there is no authenticated user or the profile row is missing.
// Used by the onboarding gate and by later org-scoped pages.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("getProfile error:", error.message);
    return null;
  }

  return data as Profile;
}
