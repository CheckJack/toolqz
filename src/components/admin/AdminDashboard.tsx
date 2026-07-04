"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AFFILIATE_STATUSES } from "@/types/affiliate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
  ACTIVE: "text-emerald-400",
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
      <AdminPageHeader
        hideTitle
        title="Dashboard"
        description={
          data.myOverdue > 0
            ? `${data.myOverdue} overdue follow-up${data.myOverdue === 1 ? "" : "s"} need attention`
            : `Welcome back, ${data.userName ?? user.name}`
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/affiliates?action=create" className="admin-btn-primary">
          + Add program
        </Link>
        <Link href="/admin/affiliates?status=PENDING" className="admin-btn-secondary">
          Review pending
        </Link>
        <Link href="/admin/tools?affiliateFilter=missing" className="admin-btn-secondary">
          Tools missing affiliate ({data.toolsMissingAffiliate})
        </Link>
        <Link href="/admin/affiliates?hasTool=false" className="admin-btn-secondary">
          CRM without tool ({data.programsNoTool})
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clicks today", value: data.todayClicks, href: "/admin/analytics?range=7d" },
          { label: "Clicks this week", value: data.weekClicks, href: "/admin/analytics?range=7d" },
          { label: "Clicks this month", value: data.monthClicks, href: "/admin/analytics?range=30d" },
          { label: "Total clicks", value: data.totalClicks, href: "/admin/analytics?range=all" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="admin-card admin-card-pad transition hover:border-border-hover"
          >
            <p className="admin-stat-label">{stat.label}</p>
            <p className="admin-stat-value">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="admin-card admin-card-pad">
        <h2 className="admin-section-title mb-4">My work</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/affiliates?mine=true"
            className="rounded-lg border border-dark-border p-4 transition hover:border-border-hover"
          >
            <p className="admin-stat-label">Assigned to me</p>
            <p className="admin-stat-value">{data.myAssigned}</p>
          </Link>
          <div className="rounded-lg border border-dark-border p-4">
            <Link href="/admin/affiliates?mine=true&followups=due" className="block">
              <p className="admin-stat-label">My overdue follow-ups</p>
              <p className="admin-stat-value text-red-400">{data.myOverdue}</p>
            </Link>
            {data.myOverdue > 0 && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                href="/api/admin/affiliates/export?mine=true&followups=due"
                className="admin-link-accent mt-2 inline-block"
              >
                Export CSV
              </a>
            )}
          </div>
          <Link
            href="/admin/affiliates?status=IN_PROGRESS&mine=true"
            className="rounded-lg border border-dark-border p-4 transition hover:border-border-hover"
          >
            <p className="admin-stat-label">My in progress</p>
            <p className="admin-stat-value text-sky-400">{data.myInProgress}</p>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card admin-card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="admin-section-title">Last 7 days</h2>
            <Link href="/admin/analytics" className="admin-link-accent">
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
                    <div
                      className="w-full rounded-t bg-white/25"
                      style={{ height: `${Math.max(height, 6)}%` }}
                    />
                    <span className="text-[9px] text-muted-dim">{day.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <ul className="mt-4 space-y-2">
            {data.topTools.slice(0, 5).map((tool) => (
              <li key={tool.slug} className="flex justify-between text-sm">
                <Link href={`/admin/tools/${tool.toolId}`} className="admin-link truncate pr-4">
                  {tool.name}
                </Link>
                <span className="shrink-0 font-medium tabular-nums text-white">{tool.clicks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-card admin-card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="admin-section-title">Affiliate pipeline</h2>
            <Link href="/admin/affiliates" className="admin-link-accent">
              Manage
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {AFFILIATE_STATUSES.map((status) => {
              const count = data.affiliateCounts[status] ?? 0;
              return (
                <li key={status} className="flex justify-between">
                  <Link href={statusLinks[status]} className="admin-link">
                    {status.replace(/_/g, " ")}
                  </Link>
                  <span className={`font-medium tabular-nums ${statusColors[status] ?? ""}`}>
                    {count}
                  </span>
                </li>
              );
            })}
            <li className="flex justify-between border-t border-dark-border pt-3">
              <Link href="/admin/affiliates?unassigned=true" className="admin-link">
                Unassigned
              </Link>
              <span className="font-medium tabular-nums text-amber-400">{data.unassignedCount}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/admin/affiliates?followups=due" className="admin-link">
                Follow-ups due (7 days)
              </Link>
              <span className="font-medium tabular-nums text-red-400">{data.followUpsDue}</span>
            </li>
            <li className="flex justify-between border-t border-dark-border pt-3">
              <Link href="/admin/tools?publishedFilter=published" className="admin-link">
                Published tools
              </Link>
              <span className="font-medium tabular-nums text-white">{data.toolCount}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
