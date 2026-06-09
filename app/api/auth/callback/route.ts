import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";

export const dynamic = "force-dynamic";

// PKCE code-exchange callback.
//
// MVP v1 uses email/password auth, which establishes the session directly on
// the client and does NOT route through here. This handler is retained for the
// OAuth and Magic Link flows (currently disabled in app/signin/page.tsx) — they
// redirect back with a `?code=` param that must be exchanged for a session.
// It also handles the email-confirmation link for password sign-ups when
// "Confirm email" is enabled in Supabase Auth settings.
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}
