import { createClient } from "@/libs/supabase/server";

// Server-only gate for the private prompt-analysis page. Only the email set in
// PROMPT_LOG_VIEWER_EMAIL (case-insensitive) may view it; everyone else gets
// a 404 so the route stays invisible in the app.
export async function isPromptLogViewer(): Promise<boolean> {
  const allowedEmail = process.env.PROMPT_LOG_VIEWER_EMAIL?.trim();
  if (!allowedEmail) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  return user.email.toLowerCase() === allowedEmail.toLowerCase();
}
