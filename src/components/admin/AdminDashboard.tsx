"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AFFILIATE_STATUSES } from "@/types/affiliate";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { SessionUser } from "@/lib/auth";

interface DashboardData {
  totalClicks: number;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  topTools: { toolId: string; name: string; slug: string; clicks: number }[];
  dailyClicks: { date: string; count: number }[];
  toolCount: number;
  affiliateCounts: Record<string, number>;
  unassignedCount: number;
  followUpsDue: number;
  myAssigned: number;
  myOverdue: number;
  myInProgress: number;
  toolsMissingAffiliate: number;
  programsNoTool: number;
  userName: string;
}

const statusLinks: Record<string, string> = {
  PENDING: "/admin/affiliates?status=PENDING",
  IN_PROGRESS: "/admin/affiliates?status=IN_PROGRESS",
  APPLIED: "/admin/affiliates?status=APPLIED",
  ACTIVE: "/admin/affiliates?status=ACTIVE",
  REJECTED: "/admin/affiliates?status=REJECTED",
  PAUSED: "/admin/affiliates?status=PAUSED",
  NOT_AVAILABLE: "/admin/affiliates?status=NOT_AVAILABLE",
  ON_HOLD: "/admin/affiliates?status=ON_HOLD",
};

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400",
  IN_PROGRESS: "text-blue-400",
  APPLIED: "text-purple-400",
  ACTIVE: "text-neon",
  REJECTED: "text-red-400",
  PAUSED: "text-muted",
  NOT_AVAILABLE: "text-orange-400",
  ON_HOLD: "text-amber-400",
};

export function AdminDashboard({ user }: { user: SessionUser }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);
    setError("");
    fetch("/api/admin/analytics?mode=dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) return <AdminSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button onClick={loadDashboard} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <AdminSkeleton />;

  const maxDaily = Math.max(...data.dailyClicks.map((d) => Number(d.count)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {data.userName ?? user.name}</h1>
        <p className="text-muted">
          {data.myOverdue > 0
            ? `${data.myOverdue} overdue follow-up${data.myOverdue === 1 ? "" : "s"} need attention`
            : "Overview of clicks and affiliate pipeline"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/affiliates?action=create" className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink">
          + Add program
        </Link>
        <Link href="/admin/affiliates?status=PENDING" className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white">
          Review pending
        </Link>
        <Link href="/admin/tools?affiliateFilter=missing" className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white">
          Tools missing affiliate ({data.toolsMissingAffiliate})
        </Link>
        <Link href="/admin/affiliates?hasTool=false" className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white">
          CRM without tool ({data.programsNoTool})
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clicks today", value: data.todayClicks, href: "/admin/analytics?range=7d" },
          { label: "Clicks this week", value: data.weekClicks, href: "/admin/analytics?range=7d" },
          { label: "Clicks this month", value: data.monthClicks, href: "/admin/analytics?range=30d" },
          { label: "Total clicks", value: data.totalClicks, href: "/admin/analytics?range=all" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-dark-border bg-dark-elevated p-5 transition hover:border-neon/30"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-neon">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <h2 className="mb-4 font-semibold">My work</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/admin/affiliates?mine=true" className="rounded-xl border border-dark-border p-4 hover:border-neon/30">
            <p className="text-sm text-muted">Assigned to me</p>
            <p className="text-2xl font-bold text-neon">{data.myAssigned}</p>
          </Link>
          <div className="rounded-xl border border-dark-border p-4">
            <Link href="/admin/affiliates?mine=true&followups=due" className="block hover:opacity-90">
              <p className="text-sm text-muted">My overdue follow-ups</p>
              <p className="text-2xl font-bold text-red-400">{data.myOverdue}</p>
            </Link>
            {data.myOverdue > 0 && (
              // API download — not a Next.js page route
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                href="/api/admin/affiliates/export?mine=true&followups=due"
                className="mt-2 inline-block text-xs text-neon hover:underline"
              >
                Export CSV
              </a>
            )}
          </div>
          <Link href="/admin/affiliates?status=IN_PROGRESS&mine=true" className="rounded-xl border border-dark-border p-4 hover:border-neon/30">
            <p className="text-sm text-muted">My in progress</p>
            <p className="text-2xl font-bold text-blue-400">{data.myInProgress}</p>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Last 7 days</h2>
            <Link href="/admin/analytics" className="text-sm text-neon hover:underline">
              Full analytics
            </Link>
          </div>
          {data.dailyClicks.length === 0 ? (
            <p className="text-sm text-muted">No clicks yet.</p>
          ) : (
            <div className="flex h-24 items-end gap-1">
              {data.dailyClicks.slice(-7).map((day) => {
                const count = Number(day.count);
                const height = (count / maxDaily) * 100;
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.date}: ${count}`}>
                    <div className="w-full rounded-t bg-neon/70" style={{ height: `${Math.max(height, 6)}%` }} />
                    <span className="text-[9px] text-muted">{day.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <ul className="mt-4 space-y-2">
            {data.topTools.slice(0, 5).map((tool) => (
              <li key={tool.slug} className="flex justify-between text-sm">
                <Link href={`/admin/tools/${tool.toolId}`} className="hover:text-neon">
                  {tool.name}
                </Link>
                <span className="font-semibold text-neon">{tool.clicks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Affiliate pipeline</h2>
            <Link href="/admin/affiliates" className="text-sm text-neon hover:underline">
              Manage
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {AFFILIATE_STATUSES.map((status) => {
              const count = data.affiliateCounts[status] ?? 0;
              return (
                <li key={status} className="flex justify-between">
                  <Link href={statusLinks[status]} className="text-muted hover:text-neon">
                    {status.replace(/_/g, " ")}
                  </Link>
                  <span className={`font-semibold ${statusColors[status] ?? ""}`}>{count}</span>
                </li>
              );
            })}
            <li className="flex justify-between border-t border-dark-border pt-3">
              <Link href="/admin/affiliates?unassigned=true" className="text-muted hover:text-neon">
                Unassigned
              </Link>
              <span className="font-semibold text-yellow-400">{data.unassignedCount}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/admin/affiliates?followups=due" className="text-muted hover:text-neon">
                Follow-ups due (7 days)
              </Link>
              <span className="font-semibold text-red-400">{data.followUpsDue}</span>
            </li>
            <li className="flex justify-between border-t border-dark-border pt-3">
              <Link href="/admin/tools?publishedFilter=published" className="text-muted hover:text-neon">
                Published tools
              </Link>
              <span className="font-semibold">{data.toolCount}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
