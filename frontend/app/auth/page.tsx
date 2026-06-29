"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signInUser } from "../utils/httpClient";
import { useAuth } from "@/context/useAuth";
import Toast from "@/components/Toast";

export default function AuthPage() {
  const router = useRouter();
  const { logIn, isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const initialMode = searchParams.get("mode") as "signin" | "signup" | null;
  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode ?? "signin",
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  if (isLoggedIn) {
    router.push("/markets");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <aside className="relative hidden overflow-hidden border-r border-border lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(800px circle at 20% 30%, oklch(0.82 0.14 200 / 0.22), transparent 60%), radial-gradient(600px circle at 70% 80%, oklch(0.78 0.17 155 / 0.14), transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-mono text-sm font-bold">L</span>
            </div>
            <span className="text-sm font-semibold">Lumen</span>
          </Link>
          <div className="max-w-md">
            <div className="num text-xs uppercase tracking-widest text-muted-foreground">
              / Live
            </div>
            <p className="mt-3 text-2xl font-medium leading-tight">
              "I cleared 14 trades before my coffee got cold. The fills are
              <span className="text-primary"> stupid fast.</span>"
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-surface-3" />
              <div>
                <div className="text-sm font-medium">Mara K.</div>
                <div className="text-xs text-muted-foreground">
                  Prop desk, Singapore
                </div>
              </div>
            </div>
          </div>
          <div className="num text-xs text-muted-foreground">
            ◇ Proof-of-reserves verified · Audit Q4 2025
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to access the terminal."
              : "Two-minute setup. No card required."}
          </p>

          {/* <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="btn-ghost gap-2 text-sm" type="button">
              <GoogleIcon /> Google
            </button>
            <button className="btn-ghost gap-2 text-sm" type="button">
              <AppleIcon /> Apple
            </button>
          </div> */}

          {/* <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR{" "}
            <div className="h-px flex-1 bg-border" />
          </div> */}

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!emailRef.current || !passwordRef.current) {
                alert("Enter Email and Password");
                return;
              }

              try {
                await logIn(
                  mode,
                  emailRef.current.value,
                  passwordRef.current.value,
                );
                setToast({
                  type: "success",
                  message: `${mode} Successful`,
                });
                if (localStorage.getItem("token")) {
                  router.push("/markets");
                }
              } catch (err) {
                console.error(err);
                setToast({
                  type: "error",
                  message: `${err}`,
                });
              }
            }}
          >
            <Field
              label="Email"
              name="email"
              type="email"
              forwardRef={emailRef}
              placeholder="you@domain.com"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••••"
              forwardRef={passwordRef}
              // hint={
              //   mode === "signin" ? (
              //     <a className="text-primary hover:underline" href="#">
              //       Forgot?
              //     </a>
              //   ) : null
              // }
            />
            <button type="submit" className="btn-primary mt-4 w-full">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? "New to BeeNance? "
              : "Already have an account? "}
            <button
              className="text-foreground hover:text-primary"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>

          {mode === "signup" && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing up you agree to our{" "}
              <a className="underline" href="#">
                Terms
              </a>{" "}
              and{" "}
              <a className="underline" href="#">
                Privacy Policy
              </a>
              .
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  hint,
  forwardRef,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  hint?: React.ReactNode;
  forwardRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{hint}</span>
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        ref={forwardRef}
        className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.37-1.6 4.02-5.35 4.02-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.48C16.7 3.83 14.6 3 12 3 6.97 3 3 6.97 3 12s3.97 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.06-1.05-.15-1.5z"
      />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.12 3.04-.75.87-1.97 1.55-3.07 1.46-.13-1.1.43-2.27 1.12-3.05.78-.88 2.1-1.55 3.07-1.45zm3.45 17.07c-.62 1.36-.92 1.97-1.71 3.17-1.1 1.66-2.65 3.72-4.57 3.74-1.71.02-2.15-1.12-4.47-1.1-2.32.02-2.81 1.12-4.52 1.1-1.92-.02-3.39-1.88-4.49-3.54C.16 17.39-.46 11.74 1.74 8.7c1.56-2.16 4.02-3.43 6.33-3.43 2.35 0 3.83 1.29 5.77 1.29 1.88 0 3.03-1.29 5.75-1.29 2.06 0 4.24 1.12 5.79 3.06-5.09 2.79-4.26 10.06.99 12.17z" />
    </svg>
  );
}
