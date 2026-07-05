"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AFFILIATE_STATUSES } from "@/types/affiliate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { DonutBreakdownChart } from "@/components/admin/charts/DonutBreakdownChart";
import { HorizontalBarChart } from "@/components/admin/charts/HorizontalBarChart";
import { SessionUser } from "@/lib/auth";
import { CHART, PIPELINE_COLORS, toDailyChartRows, toRankChartRows } from "@/lib/admin-charts";

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

const statusBadge: Record<string, string> = {
  PENDING: "bg-yellow-400/10 text-yellow-400",
  IN_PROGRESS: "bg-blue-400/10 text-blue-400",
  APPLIED: "bg-purple-400/10 text-purple-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-400",
  REJECTED: "bg-red-400/10 text-red-400",
  PAUSED: "bg-dark-border text-muted",
  NOT_AVAILABLE: "bg-orange-400/10 text-orange-400",
  ON_HOLD: "bg-amber-400/10 text-amber-400",
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

  async function exportOverdueCsv() {
    try {
      const res = await fetch("/api/admin/affiliates/export?mine=true&followups=due");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `toolqz-overdue-followups-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Non-blocking export from dashboard banner
    }
  }

  if (loading && !data) return <AdminSkeleton rows={8} />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={loadDashboard} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <AdminSkeleton rows={8} />;

  const clickTrend = toDailyChartRows(data.dailyClicks.slice(-7));
  const topToolChart = toRankChartRows(
    data.topTools.map((tool) => ({ name: tool.name, value: tool.clicks })),
    5
  );
  const pipelineChart = AFFILIATE_STATUSES.map((status) => ({
    name: status.replace(/_/g, " "),
    fullName: status,
    value: data.affiliateCounts[status] ?? 0,
    color: PIPELINE_COLORS[status] ?? CHART.muted,
  })).filter((row) => row.value > 0);
  const clickShareDonut = [
    { name: "Last 7 days", value: data.weekClicks, color: CHART.primary },
    {
      name: "Earlier (30d window)",
      value: Math.max(0, data.monthClicks - data.weekClicks),
      color: CHART.muted,
    },
  ];

  const pendingCount = data.affiliateCounts.PENDING ?? 0;
  const totalPrograms = AFFILIATE_STATUSES.reduce(
    (sum, status) => sum + (data.affiliateCounts[status] ?? 0),
    0
  );

  const issueItems = [
    {
      label: "Overdue follow-ups",
      value: data.myOverdue,
      href: "/admin/affiliates?mine=true&followups=due",
      tone: "text-red-400",
      show: data.myOverdue > 0,
    },
    {
      label: "Tools missing affiliate URL",
      value: data.toolsMissingAffiliate,
      href: "/admin/tools?affiliateFilter=missing",
      tone: "text-amber-400",
      show: data.toolsMissingAffiliate > 0,
    },
    {
      label: "CRM programs without tool",
      value: data.programsNoTool,
      href: "/admin/affiliates?hasTool=false",
      tone: "text-amber-400",
      show: data.programsNoTool > 0,
    },
    {
      label: "Unassigned programs",
      value: data.unassignedCount,
      href: "/admin/affiliates?unassigned=true",
      tone: "text-muted",
      show: data.unassignedCount > 0,
    },
    {
      label: "Follow-ups due (team)",
      value: data.followUpsDue,
      href: "/admin/affiliates?followups=due",
      tone: "text-muted",
      show: data.followUpsDue > 0,
    },
  ].filter((item) => item.show);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Dashboard"
        description={`Welcome back, ${data.userName ?? user.name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/analytics?tab=clicks" className="admin-toolbar-btn">
              Analytics
            </Link>
            <Link href="/admin/affiliates?action=create" className="admin-btn-primary">
              Add program
            </Link>
          </div>
        }
      />

      {data.myOverdue > 0 && (
        <div className="admin-card flex flex-col gap-3 border-red-500/25 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-red-200">
            You have{" "}
            <span className="font-semibold text-red-400">
              {data.myOverdue} overdue follow-up{data.myOverdue === 1 ? "" : "s"}
            </span>{" "}
            that need attention.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/affiliates?mine=true&followups=due" className="admin-toolbar-btn">
              View mine
            </Link>
            <button
              type="button"
              onClick={() => void exportOverdueCsv()}
              className="admin-toolbar-btn"
            >
              Export CSV
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Clicks today",
            value: data.todayClicks,
            href: "/admin/analytics?tab=clicks&range=7d",
            highlight: true,
          },
          {
            label: "Clicks this week",
            value: data.weekClicks,
            href: "/admin/analytics?tab=clicks&range=7d",
          },
          {
            label: "Clicks this month",
            value: data.monthClicks,
            href: "/admin/analytics?tab=clicks&range=30d",
          },
          {
            label: "Total clicks",
            value: data.totalClicks,
            href: "/admin/analytics?tab=clicks&range=all",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`admin-card admin-card-pad transition hover:border-border-hover ${
              stat.highlight ? "border-neon/20 bg-neon/5" : ""
            }`}
          >
            <p className="admin-stat-label">{stat.label}</p>
            <p className={`admin-stat-value ${stat.highlight ? "text-neon" : ""}`}>
              {stat.value.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card admin-card-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="admin-section-title">My work</h2>
            <Link href="/admin/affiliates?mine=true" className="admin-link-accent text-sm">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/affiliates?mine=true"
              className="rounded-lg border border-dark-border p-4 transition hover:border-border-hover"
            >
              <p className="admin-stat-label">Assigned to me</p>
              <p className="admin-stat-value">{data.myAssigned.toLocaleString()}</p>
            </Link>
            <Link
              href="/admin/affiliates?mine=true&followups=due"
              className={`rounded-lg border p-4 transition hover:border-border-hover ${
                data.myOverdue > 0 ? "border-red-500/30 bg-red-500/5" : "border-dark-border"
              }`}
            >
              <p className="admin-stat-label">Overdue follow-ups</p>
              <p className="admin-stat-value text-red-400">{data.myOverdue.toLocaleString()}</p>
            </Link>
            <Link
              href="/admin/affiliates?status=IN_PROGRESS&mine=true"
              className="rounded-lg border border-dark-border p-4 transition hover:border-border-hover"
            >
              <p className="admin-stat-label">In progress</p>
              <p className="admin-stat-value text-sky-400">{data.myInProgress.toLocaleString()}</p>
            </Link>
          </div>
        </div>

        <div className="admin-card admin-card-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="admin-section-title">Quick actions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingCount > 0 && (
              <Link
                href="/admin/affiliates?status=PENDING"
                className="admin-toolbar-btn"
              >
                Review pending
                <span className="tabular-nums opacity-70">{pendingCount}</span>
              </Link>
            )}
            <Link href="/admin/tools/new" className="admin-toolbar-btn">
              Add tool
            </Link>
            <Link href="/admin/agent" className="admin-toolbar-btn">
              Assistant
            </Link>
            <Link href="/admin/finances" className="admin-toolbar-btn">
              Finances
            </Link>
          </div>

          {issueItems.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-dark-border/60 pt-4">
              {issueItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-dark-border px-3 py-2 text-sm transition hover:border-border-hover"
                  >
                    <span className="text-muted">{item.label}</span>
                    <span className={`font-medium tabular-nums ${item.tone}`}>
                      {item.value.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-dark-border/60 pt-4 text-sm text-muted">
              No open issues flagged right now.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminChartCard
          title="Click trend"
          description="Outbound Visit link clicks over the last 7 days"
          action={
            <Link href="/admin/analytics?tab=clicks" className="admin-link-accent">
              Full analytics
            </Link>
          }
        >
          <DailyAreaChart
            data={clickTrend}
            valueLabel="Clicks"
            emptyMessage="No clicks yet."
            height={240}
          />
        </AdminChartCard>

        <AdminChartCard title="Top tools" description="Most clicked tools recently">
          <HorizontalBarChart
            data={topToolChart}
            valueLabel="Clicks"
            emptyMessage="No tool clicks yet."
            height={220}
          />
        </AdminChartCard>

        <AdminChartCard
          title="Affiliate pipeline"
          description={`${totalPrograms.toLocaleString()} programs across all statuses`}
          action={
            <Link href="/admin/affiliates" className="admin-link-accent">
              Manage CRM
            </Link>
          }
        >
          <HorizontalBarChart
            data={pipelineChart}
            valueLabel="Programs"
            emptyMessage="No affiliate programs yet."
            height={Math.max(220, pipelineChart.length * 36 + 48)}
          />
        </AdminChartCard>

        <AdminChartCard
          title="Click volume"
          description="Recent vs earlier activity in the last 30 days"
        >
          <DonutBreakdownChart
            data={clickShareDonut}
            valueLabel="Clicks"
            emptyMessage="No click activity yet."
            height={240}
          />
        </AdminChartCard>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-dark-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="admin-section-title">Affiliate pipeline</h2>
            <p className="mt-0.5 text-[12px] text-muted">Programs by CRM status</p>
          </div>
          <Link href="/admin/affiliates" className="admin-link-accent text-sm">
            Open CRM
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[420px]">
            <thead>
              <tr>
                <th>Status</th>
                <th className="text-right">Programs</th>
              </tr>
            </thead>
            <tbody>
              {AFFILIATE_STATUSES.map((status) => {
                const count = data.affiliateCounts[status] ?? 0;
                return (
                  <tr key={status}>
                    <td>
                      <Link
                        href={statusLinks[status]}
                        className="inline-flex items-center gap-2 font-medium text-white hover:text-neon"
                      >
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            statusBadge[status] ?? "bg-dark-border text-muted"
                          }`}
                        >
                          {status.replace(/_/g, " ")}
                        </span>
                      </Link>
                    </td>
                    <td className={`text-right font-medium tabular-nums ${statusColors[status] ?? "text-muted"}`}>
                      {count.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-2 border-t border-dark-border px-4 py-4 sm:grid-cols-3 sm:px-5">
          <Link
            href="/admin/affiliates?unassigned=true"
            className="flex items-center justify-between rounded-lg border border-dark-border px-3 py-2 text-sm transition hover:border-border-hover"
          >
            <span className="text-muted">Unassigned</span>
            <span className="font-medium tabular-nums text-white">
              {data.unassignedCount.toLocaleString()}
            </span>
          </Link>
          <Link
            href="/admin/affiliates?followups=due"
            className="flex items-center justify-between rounded-lg border border-dark-border px-3 py-2 text-sm transition hover:border-border-hover"
          >
            <span className="text-muted">Follow-ups due</span>
            <span className="font-medium tabular-nums text-white">
              {data.followUpsDue.toLocaleString()}
            </span>
          </Link>
          <Link
            href="/admin/tools"
            className="flex items-center justify-between rounded-lg border border-dark-border px-3 py-2 text-sm transition hover:border-border-hover"
          >
            <span className="text-muted">Published tools</span>
            <span className="font-medium tabular-nums text-white">
              {data.toolCount.toLocaleString()}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
