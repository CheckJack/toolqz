"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminAuthShell, adminAuthInputClass } from "@/components/admin/AdminAuthShell";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send reset link");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      title="Forgot password"
      subtitle={
        sent
          ? "Check your inbox for a reset link"
          : "We'll email you a link to choose a new password"
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm leading-relaxed text-muted">
            If an account exists for <span className="text-white">{email}</span>, we sent a
            password reset link. It expires in 1 hour.
          </p>
          <p className="text-[12px] text-muted-dim">
            Didn&apos;t get it? Check spam, or try again with the correct team email.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="w-full rounded-xl border border-dark-border py-3 text-sm text-muted transition-colors hover:text-white"
            >
              Try another email
            </button>
            <Link
              href="/admin/login"
              className="w-full rounded-xl bg-neon py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-neon-dim"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              autoComplete="email"
              className={adminAuthInputClass}
              placeholder="you@company.com"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neon py-3 font-semibold text-ink transition-colors hover:bg-neon-dim disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="text-center text-sm text-muted">
            <Link href="/admin/login" className="text-neon hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AdminAuthShell>
  );
}
