"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminAssistantWidget } from "@/components/admin/AdminAssistantWidget";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import {
  ADMIN_NAV_GROUPS,
  getAdminPageMeta,
  isAdminNavActive,
  type NavBadgeKey,
} from "@/lib/admin-nav";
import { SessionUser } from "@/lib/auth";

type NavCounts = { myOverdue: number; followUpsDue: number; unreadMessages: number };

function navBadge(
  badgeKey: NavBadgeKey | undefined,
  navCounts: NavCounts | null
): number {
  if (!badgeKey || !navCounts) return 0;
  if (badgeKey === "crm") {
    if (navCounts.myOverdue > 0) return navCounts.myOverdue;
    if (navCounts.followUpsDue > 0) return navCounts.followUpsDue;
    return 0;
  }
  if (badgeKey === "messages") return navCounts.unreadMessages;
  return 0;
}

function AdminShellInner({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navCounts, setNavCounts] = useState<NavCounts | null>(null);
  const mobileAsideRef = useRef<HTMLElement>(null);
  const pageMeta = getAdminPageMeta(pathname);

  useEffect(() => {
    fetch("/api/admin/nav-counts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setNavCounts(data))
      .catch(() => {});

    const onMessages = () => {
      fetch("/api/admin/nav-counts")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setNavCounts(data))
        .catch(() => {});
    };
    window.addEventListener("admin:messages-updated", onMessages);
    return () => window.removeEventListener("admin:messages-updated", onMessages);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    mobileAsideRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [sidebarOpen]);

  async function handleLogout() {
    const btn = document.activeElement as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      if (btn) btn.disabled = false;
      toast("Could not sign out — check your connection", "error");
    }
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-4 py-4">
        <Link href="/admin" onClick={() => setSidebarOpen(false)} className="min-w-0">
          <BrandLogo as="span" size="sm" />
        </Link>
        <span className="admin-pill shrink-0">Admin</span>
      </div>

      {navCounts && navCounts.myOverdue > 0 && (
        <Link
          href="/admin/affiliates?mine=true&followups=due"
          onClick={() => setSidebarOpen(false)}
          className="mx-3 mt-3 block rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[12px] leading-snug text-red-200 transition hover:bg-red-500/10"
        >
          <span className="font-medium text-red-300">{navCounts.myOverdue} overdue</span>
          <span className="text-red-200/80"> — follow-ups need attention</span>
        </Link>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || user.role === "ADMIN");
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-dim">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isAdminNavActive(pathname, item.href);
                  const badge = navBadge(item.badgeKey, navCounts);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {badge > 0 && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                              item.badgeKey === "messages"
                                ? "bg-white/10 text-white"
                                : navCounts?.myOverdue
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-dark-border p-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("admin:command-palette"))}
          className="admin-toolbar-btn w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            Quick jump
          </span>
          <kbd className="kbd-hint rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-dim">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/admin/settings"
          onClick={() => setSidebarOpen(false)}
          className="block rounded-lg border border-dark-border bg-dark/40 px-3 py-2.5 transition hover:border-border-hover hover:bg-dark/60"
        >
          <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
          <p className="truncate text-[11px] text-muted-dim">{user.email}</p>
          <p className="mt-1 text-[10px] text-neon">Profile settings</p>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            target="_blank"
            className="admin-toolbar-btn justify-center text-center"
          >
            View site
          </Link>
          <button type="button" onClick={handleLogout} className="admin-toolbar-btn justify-center">
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <AdminCommandPalette />

      <aside className="hidden h-screen w-[15.5rem] shrink-0 border-r border-dark-border bg-dark-surface lg:block">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            ref={mobileAsideRef}
            tabIndex={-1}
            className="relative h-full w-[15.5rem] bg-dark-surface shadow-2xl outline-none"
            aria-label="Navigation menu"
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-dark-border bg-dark-elevated/90 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="admin-icon-btn lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-white">
                {pageMeta.title}
              </p>
              <p className="truncate text-[10px] text-muted-dim">{pageMeta.section}</p>
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-dim">
                {pageMeta.section}
              </p>
              <h1 className="truncate text-[15px] font-medium tracking-[-0.02em] text-white">
                {pageMeta.title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("admin:command-palette"))}
              className="admin-icon-btn"
              title="Quick jump (⌘K)"
              aria-label="Quick jump"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </button>

            {user.role === "ADMIN" && pathname !== "/admin/agent" && (
              <Link
                href="/admin/agent"
                className="admin-icon-btn"
                title="Open assistant"
                aria-label="Assistant"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            )}

            <AdminNotificationBell />

            <Link
              href="/"
              target="_blank"
              className="admin-toolbar-btn hidden md:inline-flex"
            >
              View site
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <AdminAssistantWidget user={user} />
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminShellInner user={user}>{children}</AdminShellInner>
    </ToastProvider>
  );
}
