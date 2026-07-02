"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import {
  canShowNewsletterOnToolPage,
  clearToolNavigationIntent,
  dismissNewsletterPopup,
  isToolDetailPath,
  markHomepageVisited,
  markNewsletterShownThisSession,
  markNewsletterSubscribed,
  shouldForceNewsletterPreview,
  TOOL_PAGE_POPUP_DELAY_MS,
} from "@/lib/newsletter";

const fieldClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-4 py-2.5 text-[15px] text-white placeholder:text-muted-dim transition-[border-color,box-shadow] focus:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-neon/10";

export function NewsletterPopup() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const delayTimerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    dismissNewsletterPopup();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }

    if (!isToolDetailPath(pathname)) {
      setVisible(false);
      return;
    }

    if (pathname?.startsWith("/admin")) return;

    if (shouldForceNewsletterPreview(window.location.search)) {
      setVisible(true);
      return;
    }

    if (!canShowNewsletterOnToolPage(pathname)) {
      setVisible(false);
      return;
    }

    delayTimerRef.current = window.setTimeout(() => {
      clearToolNavigationIntent();
      setVisible(true);
    }, TOOL_PAGE_POPUP_DELAY_MS);

    return () => {
      if (delayTimerRef.current !== null) {
        window.clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [mounted, pathname]);

  useEffect(() => {
    if (pathname === "/") {
      markHomepageVisited();
    }
  }, [pathname]);

  useEffect(() => {
    if (visible) {
      markNewsletterShownThisSession();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 120);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, close]);

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
      window.setTimeout(() => setVisible(false), 2200);
    } catch {
      setError("Could not subscribe right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="newsletter-modal-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
      onClick={close}
    >
      <div
        ref={panelRef}
        className="newsletter-modal-panel surface relative w-full max-w-lg overflow-hidden rounded-2xl shadow-[0_24px_80px_var(--shadow-surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <BrandLogo as="span" size="lg" />
            <button
              type="button"
              onClick={close}
              className="btn-ghost -mr-1 min-h-9 rounded-lg px-2 py-1 text-muted hover-subtle"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neon/25 bg-neon/10">
                <svg
                  className="h-6 w-6 text-neon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[16px] font-medium text-white">You&apos;re on the list.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We&apos;ll send tested tool picks when there&apos;s something worth your time.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Newsletter
              </p>
              <h2
                id="newsletter-title"
                className="mt-3 text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[1.85rem]"
              >
                Get life-hack tools
                <br />
                <span className="text-muted">worth your inbox</span>
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                New tested picks, honest reviews, and updates from TOOLQZ — no spam, unsubscribe
                anytime.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="newsletter-name" className="mb-1.5 block text-[13px] text-muted">
                      Name
                    </label>
                    <input
                      ref={nameRef}
                      id="newsletter-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="newsletter-email" className="mb-1.5 block text-[13px] text-muted">
                      Email
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto sm:min-w-[9.5rem] disabled:opacity-50"
                  >
                    {loading ? "Subscribing…" : "Subscribe"}
                  </button>
                  <button type="button" onClick={close} className="btn-ghost w-full py-2.5 sm:w-auto">
                    Not now
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
