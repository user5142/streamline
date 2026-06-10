"use client";

import Link from "next/link";
import Image from "next/image";
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

  // After auth, send the user to ?next= when present (e.g. an invite link),
  // otherwise the default callback URL. Only same-origin relative paths are
  // honored, to avoid open-redirect abuse.
  const getRedirectTarget = (): string => {
    if (typeof window === "undefined") return config.auth.callbackUrl;
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
    return config.auth.callbackUrl;
  };

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
          router.push(getRedirectTarget());
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

        router.push(getRedirectTarget());
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
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-base-200 px-6 py-12"
      data-theme={config.colors.theme}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" title={`${config.appName} home`}>
            <Image
              src="/streamline-logo.svg"
              alt={`${config.appName} logo`}
              width={185}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <h1 className="mt-8 text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-center text-sm text-base-content/60">
            {mode === "signup"
              ? `Start managing projects with ${config.appName}.`
              : `Sign in to your ${config.appName} workspace.`}
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-[var(--shadow-soft)] sm:p-8">
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
                  className="link link-primary font-medium no-underline hover:underline"
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
                  className="link link-primary font-medium no-underline hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/"
            className="text-base-content/50 transition-colors hover:text-primary"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
