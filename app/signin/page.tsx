"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
// import { Provider } from "@supabase/supabase-js"; // (re-enable with OAuth below)
import toast from "react-hot-toast";
import config from "@/config";

// This is the login/sign-up page for Supabase Auth.
//
// MVP v1 uses EMAIL + PASSWORD only (see streamline-requirements.md, AUTH-01/02).
// The Google OAuth and Magic Link flows from the ShipFast boilerplate are
// intentionally preserved but commented out below — do not delete them. To
// re-enable, uncomment the relevant block and the `oauth`/`magic_link` branches
// in `handleAuth`, plus the `Provider` import above.
//
// Email/password sign-in establishes the session directly on the client (no
// PKCE code exchange), so it does NOT round-trip through /api/auth/callback.
export default function Login() {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEmailPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              window.location.origin + config.auth.callbackUrl,
          },
        });

        if (error) throw error;

        // If email confirmation is disabled in Supabase Auth settings, a
        // session is returned immediately and we can go straight in.
        // Otherwise the user must confirm via the email Supabase sends.
        if (data.session) {
          router.push(config.auth.callbackUrl);
          router.refresh();
        } else {
          toast.success("Check your email to confirm your account.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push(config.auth.callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
   * DISABLED FOR MVP — Google OAuth + Magic Link (kept for future use).
   * Re-enable the matching JSX below and the `Provider` import to restore.
   *
   * const handleSignup = async (
   *   e: any,
   *   options: { type: string; provider?: Provider }
   * ) => {
   *   e?.preventDefault();
   *   setIsLoading(true);
   *   try {
   *     const { type, provider } = options;
   *     const redirectURL = window.location.origin + "/api/auth/callback";
   *     if (type === "oauth") {
   *       await supabase.auth.signInWithOAuth({
   *         provider,
   *         options: { redirectTo: redirectURL },
   *       });
   *     } else if (type === "magic_link") {
   *       await supabase.auth.signInWithOtp({
   *         email,
   *         options: { emailRedirectTo: redirectURL },
   *       });
   *       toast.success("Check your emails!");
   *     }
   *   } catch (error) {
   *     console.log(error);
   *   } finally {
   *     setIsLoading(false);
   *   }
   * };
   * ------------------------------------------------------------------- */

  return (
    <main className="p-8 md:p-24" data-theme={config.colors.theme}>
      <div className="text-center mb-4">
        <Link href="/" className="btn btn-ghost btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-12">
        {mode === "signup" ? "Sign up for" : "Sign in to"} {config.appName}
      </h1>

      <div className="space-y-8 max-w-xl mx-auto">
        {/* -------------------------------------------------------------
          * DISABLED FOR MVP — Google OAuth button. Uncomment to restore.
          *
          * <button
          *   className="btn btn-block"
          *   onClick={(e) =>
          *     handleSignup(e, { type: "oauth", provider: "google" })
          *   }
          *   disabled={isLoading}
          * >
          *   ...Google icon + "Sign-up with Google"...
          * </button>
          *
          * <div className="divider text-xs text-base-content/50 font-medium">
          *   OR
          * </div>
          * ----------------------------------------------------------- */}

        <form
          className="form-control w-full space-y-4"
          onSubmit={handleEmailPassword}
        >
          <input
            required
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@company.com"
            className="input input-bordered w-full placeholder:opacity-60"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            required
            type="password"
            value={password}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={6}
            placeholder="Password"
            className="input input-bordered w-full placeholder:opacity-60"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="btn btn-primary btn-block"
            disabled={isLoading}
            type="submit"
          >
            {isLoading && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            {mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        {/* -------------------------------------------------------------
          * DISABLED FOR MVP — Magic Link form. Uncomment to restore.
          *
          * <form
          *   className="form-control w-full space-y-4"
          *   onSubmit={(e) => handleSignup(e, { type: "magic_link" })}
          * >
          *   <input ... type="email" ... />
          *   <button ...>Send Magic Link</button>
          * </form>
          * ----------------------------------------------------------- */}

        <p className="text-center text-sm text-base-content/70">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="link link-primary"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="link link-primary"
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
