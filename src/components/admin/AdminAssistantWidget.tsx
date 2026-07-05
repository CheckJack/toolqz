"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { SessionUser } from "@/lib/auth";
import { AdminAssistantChat } from "@/components/admin/AdminAssistantChat";

export function AdminAssistantWidget({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (user.role !== "ADMIN" && user.role !== "MEMBER") return null;
  if (pathname === "/admin/agent") return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pb-[max(0px,env(safe-area-inset-bottom))] pr-[max(0px,env(safe-area-inset-right))]">
      {/* Keep chat mounted when closed so history and drafts are preserved */}
      <div
        className={`flex flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-elevated shadow-2xl shadow-black/40 max-sm:fixed max-sm:inset-x-2 max-sm:bottom-[4.5rem] max-sm:top-16 max-sm:h-auto max-sm:max-h-none max-sm:w-auto sm:h-[min(540px,calc(100vh-6rem))] sm:w-[min(400px,calc(100vw-2rem))] ${
          open ? "" : "pointer-events-none invisible absolute bottom-0 right-0 sm:h-[min(540px,calc(100vh-6rem))] sm:w-[min(400px,calc(100vw-2rem))]"
        }`}
        aria-hidden={!open}
      >
          <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border bg-dark text-muted">
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">Assistant</p>
                <p className="text-[11px] text-muted-dim">Tools · analytics · CRM</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/agent"
                className="admin-toolbar-btn py-1.5"
                title="Open full page"
              >
                Expand
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="admin-icon-btn h-8 w-8"
                aria-label="Close assistant"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <AdminAssistantChat
            variant="widget"
            className="min-h-0 flex-1"
            persistKey="widget"
            onRequestClose={() => setOpen(false)}
          />
        </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-12 w-12 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated text-muted shadow-lg shadow-black/30 transition hover:border-border-hover hover:text-white touch-manipulation`}
        aria-label={open ? "Close assistant" : "Open assistant"}
        title="Assistant"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
