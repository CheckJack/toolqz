"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SessionUser } from "@/lib/auth";
import { TeamChatPanel } from "@/components/admin/TeamChatPanel";

export function TeamChatWidget({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refreshUnread = useCallback(() => {
    fetch("/api/admin/messages")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUnreadTotal(data.unreadTotal ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const onUpdate = () => refreshUnread();
    window.addEventListener("admin:messages-updated", onUpdate);
    const interval = setInterval(refreshUnread, 20000);
    return () => {
      window.removeEventListener("admin:messages-updated", onUpdate);
      clearInterval(interval);
    };
  }, [refreshUnread, pathname]);

  if (pathname === "/admin/messages") return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex h-[min(520px,calc(100vh-6rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-dark-border bg-dark-elevated px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Messages</p>
              <p className="text-xs text-muted">Chat with your team</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-dark-border p-1.5 text-muted hover:text-white"
              aria-label="Close chat"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <TeamChatPanel
              currentUserId={user.id}
              variant="widget"
              onUnreadChange={setUnreadTotal}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-neon text-ink shadow-lg shadow-neon/20 transition-transform hover:scale-105"
        aria-label={open ? "Close messages" : "Open messages"}
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
        {!open && unreadTotal > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>
    </div>
  );
}
