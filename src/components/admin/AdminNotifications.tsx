"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
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

export function AdminNotifications() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
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
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filter === "unread") params.set("unreadOnly", "true");
    fetch(`/api/admin/notifications?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setItems(data.items ?? []);
          setUnread(data.unread ?? 0);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      })
      .catch(() => toast("Failed to load notifications", "error"))
      .finally(() => setLoading(false));
  }, [filter, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function onFilterChange(value: "all" | "unread") {
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

  if (loading && items.length === 0) return <AdminSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
            {total > 0 ? ` · ${total} total` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as "all" | "unread")}
            className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
          </select>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
        <h2 className="text-sm font-semibold">Notification preferences</h2>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={emailFollowUpReminders}
            disabled={savingPrefs}
            onChange={(e) => void toggleEmailReminders(e.target.checked)}
          />
          <span>
            Email me when assigned follow-ups are due
            <span className="block text-xs text-muted">
              In-app notifications always appear in the bell icon
            </span>
          </span>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-12 text-center">
          <p className="text-muted">
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </p>
          <Link
            href="/admin/affiliates?mine=true&followups=due"
            className="mt-3 inline-block text-sm text-neon hover:underline"
          >
            View my follow-ups →
          </Link>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated divide-y divide-dark-border/50">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-dark/50 ${
                    !n.readAt ? "bg-neon/5" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.readAt ? "bg-transparent" : "bg-neon"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${!n.readAt ? "text-white" : "text-muted"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {new Date(n.createdAt).toLocaleString()}
                      {n.type === "follow_up_due" && " · Follow-up"}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                        void markRead(n.id);
                      }}
                      className="shrink-0 text-xs text-neon hover:underline"
                    >
                      Mark read
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
