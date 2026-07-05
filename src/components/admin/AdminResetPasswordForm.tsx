"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminAuthShell, adminAuthInputClass } from "@/components/admin/AdminAuthShell";

function AdminResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token.trim()) {
      setChecking(false);
      setValid(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Invalid");
        return r.json();
      })
      .then((data) => {
        setValid(true);
        setEmail(data.email ?? "");
      })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not reset password");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AdminAuthShell title="Reset password" subtitle="Checking your reset link…">
        <p className="text-center text-sm text-muted">One moment…</p>
      </AdminAuthShell>
    );
  }

  if (!valid) {
    return (
      <AdminAuthShell title="Reset password" subtitle="This link is invalid or has expired">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">
            Request a new link from the sign-in page. Reset links expire after 1 hour.
          </p>
          <Link
            href="/admin/login/forgot-password"
            className="inline-block w-full rounded-xl bg-neon py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-neon-dim"
          >
            Request new link
          </Link>
          <Link href="/admin/login" className="block text-sm text-neon hover:underline">
            Back to sign in
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  if (done) {
    return (
      <AdminAuthShell title="Password updated" subtitle="You can sign in with your new password">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">Your password has been changed successfully.</p>
          <button
            type="button"
            onClick={() => router.push("/admin/login")}
            className="w-full rounded-xl bg-neon py-3 font-semibold text-ink transition-colors hover:bg-neon-dim"
          >
            Sign in
          </button>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell title="Choose a new password" subtitle={`Resetting access for ${email}`}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              autoComplete="new-password"
              className={`${adminAuthInputClass} pr-12`}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition-colors hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Confirm new password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            autoComplete="new-password"
            className={adminAuthInputClass}
            minLength={6}
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-neon py-3 font-semibold text-ink transition-colors hover:bg-neon-dim disabled:opacity-50"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AdminAuthShell>
  );
}

export function AdminResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AdminAuthShell title="Reset password" subtitle="Loading…">
          <p className="text-center text-sm text-muted">One moment…</p>
        </AdminAuthShell>
      }
    >
      <AdminResetPasswordFormInner />
    </Suspense>
  );
}
