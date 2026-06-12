import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { isPromptLogViewer } from "@/libs/isPromptLogViewer";
import config from "@/config";

// Private showcase page — no sidebar, full-width presentation. Invisible to
// anyone except the email in PROMPT_LOG_VIEWER_EMAIL.
export default async function PromptAnalysisLayout({
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

  const canView = await isPromptLogViewer();
  if (!canView) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">{children}</div>
  );
}
