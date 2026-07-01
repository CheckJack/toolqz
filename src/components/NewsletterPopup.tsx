"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  dismissNewsletterPopup,
  isNewsletterDismissed,
  isNewsletterSubscribed,
  markNewsletterSubscribed,
} from "@/lib/newsletter";

const SHOW_DELAY_MS = 8000;

export function NewsletterPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (isNewsletterDismissed() || isNewsletterSubscribed()) return;

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function close() {
    dismissNewsletterPopup();
    setVisible(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, source: "popup" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      markNewsletterSubscribed();
      setSuccess(true);
      window.setTimeout(() => setVisible(false), 1800);
    } catch {
      setError("Could not subscribe right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[50] flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-label="Newsletter signup"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon/90">
              TOOLQZ picks
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Get the best tools in your inbox
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              New life-hack tools, tested picks, and updates — no spam.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg p-1 text-muted hover:bg-dark-border hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <p className="rounded-xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm text-white">
            You&apos;re on the list. Thanks for subscribing!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
            />
            <div>
              <label htmlFor="newsletter-name" className="mb-1 block text-xs text-muted">
                Name
              </label>
              <input
                id="newsletter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder:text-muted/60 focus:border-neon/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="newsletter-email" className="mb-1 block text-xs text-muted">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder:text-muted/60 focus:border-neon/50 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
            <p className="text-center text-[11px] text-muted">
              Unsubscribe anytime. We only send useful tool picks.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
