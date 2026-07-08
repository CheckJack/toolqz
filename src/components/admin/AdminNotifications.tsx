"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { EmailReminderSetting } from "@/components/admin/EmailReminderSetting";
import { useToast } from "@/components/admin/Toast";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 25;

type FilterTab = "all" | "unread";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeLabel(type: string): string | null {
  if (type === "follow_up_due") return "Follow-up";
  if (type === "team_message") return "Message";
  if (type === "task_completed") return "Task";
  if (type.startsWith("build_")) return "Deploy";
  if (type === "site_down" || type === "site_recovered") return "Hosting";
  if (type === "analytics_warning") return "Analytics";
  return null;
}

export function AdminNotifications() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [emailFollowUpReminders, setEmailFollowUpReminders] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setEmailFollowUpReminders(data.emailFollowUpReminders ?? true);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filter === "unread") params.set("unreadOnly", "true");
    fetch(`/api/admin/notifications?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setItems(data.items ?? []);
        setUnread(data.unread ?? 0);
        setAllTotal(data.allTotal ?? data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {
        setLoadError("Could not load notifications");
        toast("Failed to load notifications", "error");
      })
      .finally(() => setLoading(false));
  }, [filter, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function onFilterChange(value: FilterTab) {
    setFilter(value);
    setPage(1);
  }

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    toast("All notifications marked read");
    load();
  }

  function openNotification(n: NotificationItem) {
    void markRead(n.id);
    if (n.href) router.push(n.href);
  }

  async function toggleEmailReminders(enabled: boolean) {
    setSavingPrefs(true);
    const res = await fetch("/api/admin/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailFollowUpReminders: enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setEmailFollowUpReminders(data.emailFollowUpReminders);
      toast(enabled ? "Email reminders enabled" : "Email reminders disabled");
    } else {
      toast("Failed to update preferences", "error");
    }
    setSavingPrefs(false);
  }

  const description =
    unread > 0
      ? `${unread} unread · ${allTotal} total`
      : allTotal > 0
        ? "You're all caught up"
        : "Alerts for follow-ups and team activity";

  if (loading && items.length === 0) return <AdminSkeleton rows={8} />;

  if (loadError && items.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <button type="button" onClick={load} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Notifications"
        description={description}
        action={
          unread > 0 ? (
            <button type="button" onClick={() => void markAllRead()} className="admin-toolbar-btn">
              Mark all read
            </button>
          ) : undefined
        }
      />

      <EmailReminderSetting
        enabled={emailFollowUpReminders}
        saving={savingPrefs}
        onChange={(enabled) => void toggleEmailReminders(enabled)}
        footerLink={{ href: "/admin/settings", label: "Profile & password settings" }}
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.value;
              const count = tab.value === "unread" ? unread : allTotal;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onFilterChange(tab.value)}
                  className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
            <Link
              href="/admin/affiliates?mine=true&followups=due"
              className="admin-link-accent mt-3 inline-block"
            >
              View my follow-ups
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-dark-border/60">
              {items.map((n) => {
                const isUnread = !n.readAt;
                const label = typeLabel(n.type);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-dark/30 sm:gap-4 sm:px-5 ${
                        isUnread ? "bg-neon/5" : ""
                      }`}
                    >
                      <span
                        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                          isUnread ? "bg-neon" : "bg-transparent"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`font-medium ${isUnread ? "text-white" : "text-muted"}`}
                          >
                            {n.title}
                          </p>
                          {label && (
                            <span className="rounded-md bg-dark-border/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                              {label}
                            </span>
                          )}
                        </div>
                        {n.body && (
                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-muted-dim">
                          {formatWhen(n.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pt-0.5">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void markRead(n.id);
                            }}
                            className="admin-link-accent text-[11px] opacity-0 transition group-hover:opacity-100"
                          >
                            Mark read
                          </button>
                        )}
                        {n.href ? (
                          <ChevronRight className="h-4 w-4 text-muted opacity-60" strokeWidth={1.75} />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-border px-4 py-3 text-sm text-muted sm:px-5">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
