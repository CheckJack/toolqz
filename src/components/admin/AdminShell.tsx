"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SessionUser } from "@/lib/auth";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { TeamChatWidget } from "@/components/admin/TeamChatWidget";

const navItems = [
  { href: "/admin", label: "Dashboard", badgeKey: null as null, adminOnly: false },
  { href: "/admin/analytics", label: "Click Analytics", badgeKey: null as null, adminOnly: false },
  { href: "/admin/tools", label: "Tools", badgeKey: null as null, adminOnly: false },
  { href: "/admin/blog", label: "Blog", badgeKey: null as null, adminOnly: false },
  { href: "/admin/affiliates", label: "Affiliate CRM", badgeKey: "crm" as const, adminOnly: false },
  { href: "/admin/finances", label: "Finances", badgeKey: null as null, adminOnly: false },
  { href: "/admin/messages", label: "Messages", badgeKey: "messages" as const, adminOnly: false },
  { href: "/admin/subscribers", label: "Mailing list", badgeKey: null as null, adminOnly: false },
  { href: "/admin/team", label: "Team", badgeKey: null as null, adminOnly: false },
  { href: "/admin/audit", label: "Audit log", badgeKey: null as null, adminOnly: true },
];

type NavCounts = { myOverdue: number; followUpsDue: number; unreadMessages: number };

const shellTopBarClass =
  "flex shrink-0 items-center border-b border-dark-border p-5";

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

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/affiliates")
      return pathname.startsWith("/admin/affiliates");
    if (href === "/admin/tools") return pathname.startsWith("/admin/tools");
    if (href === "/admin/blog") return pathname.startsWith("/admin/blog");
    if (href === "/admin/audit") return pathname.startsWith("/admin/audit");
    if (href === "/admin/messages") return pathname.startsWith("/admin/messages");
    if (href === "/admin/finances") return pathname.startsWith("/admin/finances");
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className={shellTopBarClass}>
        <Link
          href="/admin"
          className="text-xl font-bold tracking-tight"
          onClick={() => setSidebarOpen(false)}
        >
          TOOL<span className="text-neon">QZ</span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems
          .filter((item) => !item.adminOnly || user.role === "ADMIN")
          .map((item) => {
          const badge =
            item.badgeKey === "crm" && navCounts
              ? navCounts.myOverdue > 0
                ? navCounts.myOverdue
                : navCounts.followUpsDue > 0
                  ? navCounts.followUpsDue
                  : 0
              : item.badgeKey === "messages" && navCounts
                ? navCounts.unreadMessages
                : 0;
          return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-neon/10 text-neon"
                : "text-muted hover:bg-dark-border/50 hover:text-white"
            }`}
          >
            <span>{item.label}</span>
            {badge > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.badgeKey === "messages"
                    ? "bg-neon/20 text-neon"
                    : navCounts?.myOverdue
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {badge}
              </span>
            )}
          </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-dark-border p-4 space-y-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("admin:command-palette"))}
          className="w-full rounded-lg border border-dark-border px-3 py-2 text-left text-xs text-muted transition-colors hover:border-neon/30 hover:text-white"
        >
          Quick jump <span className="float-right">⌘K</span>
        </button>
        <Link
          href="/"
          target="_blank"
          className="block text-sm text-muted transition-colors hover:text-neon"
        >
          View site ↗
        </Link>
        <div className="text-sm">
          <p className="font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-dark-border px-3 py-2 text-sm text-muted transition-colors hover:border-neon/30 hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <AdminCommandPalette />
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-60 shrink-0 border-r border-dark-border bg-dark-elevated lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            ref={mobileAsideRef}
            tabIndex={-1}
            className="relative h-full w-60 bg-dark-elevated shadow-xl outline-none"
            aria-label="Navigation menu"
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between gap-4 border-b border-dark-border bg-dark-elevated px-4 lg:hidden">
          <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-dark-border p-2 text-muted hover:text-white"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold">
            TOOL<span className="text-neon">QZ</span>
          </span>
          </div>
          <div className="flex items-center gap-2">
            <AdminNotificationBell />
          </div>
        </header>

        <header className={`${shellTopBarClass} hidden justify-end gap-2 bg-dark-elevated lg:flex`}>
          <AdminNotificationBell />
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <TeamChatWidget user={user} />
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
