"use client";

import { useActionState, useState } from "react";
import { handleSignIn, handleGoogleSignIn } from "@/app/actions";
import { handleCredentialsSignIn } from "@/app/actions/signin";
import { handleSignUp } from "@/app/actions/signup";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already registered. Try a different sign-in method.",
  CredentialsSignin: "Invalid email or password.",
  AccessDenied: "Access denied. Please try again.",
  Verification: "That sign-in link has expired. Please try again.",
  Default: "Something went wrong signing you in. Please try again.",
};

interface Props {
  initialError?: string;
}

export default function AuthCard({ initialError }: Props) {
  const [view, setView] = useState<"signin" | "signup">("signin");
  const topLevelError = initialError
    ? ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.Default
    : undefined;

  const [signInState, signInFormAction, signInPending] = useActionState(
    handleCredentialsSignIn,
    undefined
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    handleSignUp,
    undefined
  );

  return (
    <div className="relative z-10 flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border-subtle bg-background-card/80 p-10 shadow-2xl backdrop-blur-sm">
      {/* Toggle pill - top right */}
      <div className="absolute right-6 top-6 flex rounded-full border border-border-subtle bg-background p-1 text-xs">
        <button
          type="button"
          onClick={() => setView("signin")}
          className={`rounded-full px-3 py-1 transition ${
            view === "signin"
              ? "bg-accent-amber text-background"
              : "text-foreground-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setView("signup")}
          className={`rounded-full px-3 py-1 transition ${
            view === "signup"
              ? "bg-accent-amber text-background"
              : "text-foreground-muted"
          }`}
        >
          Sign up
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-4 text-center">
        {topLevelError && (
          <p className="rounded-xl bg-accent-coral/15 px-4 py-2.5 text-sm text-accent-coral">
            {topLevelError}
          </p>
        )}
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
          {view === "signin" ? "Live now" : "Join in"}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-foreground">
          {view === "signin" ? "Chatty" : "Create your account"}
        </h1>
        <p className="text-sm text-foreground-muted">
          {view === "signin"
            ? "The room's lit up. Come say something."
            : "Pick a name, drop your email, pick a password."}
        </p>
      </div>

      {view === "signin" ? (
        <>
          <form action={signInFormAction} className="flex flex-col gap-3">
            <input
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
            {signInState?.error && (
              <p className="text-xs text-accent-coral">{signInState.error}</p>
            )}
            <button
              type="submit"
              disabled={signInPending}
              className="rounded-xl bg-accent-amber px-6 py-3 font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-60"
            >
              {signInPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-foreground-muted">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setView("signup")}
              className="text-accent-amber underline-offset-4 hover:underline"
            >
              Sign up
            </button>
          </p>

          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-foreground-muted">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex w-full flex-col gap-3">
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-[#1E1522] transition hover:bg-white/90"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Continue with GitHub
              </button>
            </form>

            <form action={handleGoogleSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-[#1E1522] transition hover:bg-white/90"
              >
                <svg aria-hidden="true" viewBox="0 0 18 18" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </>
      ) : (
        <>
          <form action={signUpFormAction} className="flex flex-col gap-3">
            <input
              name="name"
              type="text"
              required
              placeholder="Christian"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
            {signUpState?.error && (
              <p className="text-xs text-accent-coral">{signUpState.error}</p>
            )}
            <button
              type="submit"
              disabled={signUpPending}
              className="rounded-xl bg-accent-amber px-6 py-3 font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-60"
            >
              {signUpPending ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-foreground-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setView("signin")}
              className="text-accent-amber underline-offset-4 hover:underline"
            >
              Sign in
            </button>
          </p>

          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-foreground-muted">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex w-full flex-col gap-3">
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-[#1E1522] transition hover:bg-white/90"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Sign up with GitHub
              </button>
            </form>

            <form action={handleGoogleSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-[#1E1522] transition hover:bg-white/90"
              >
                <svg aria-hidden="true" viewBox="0 0 18 18" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
                Sign up with Google
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}