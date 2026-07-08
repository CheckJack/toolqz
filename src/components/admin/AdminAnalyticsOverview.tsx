"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { MultiMetricTrendChart } from "@/components/admin/charts/MultiMetricTrendChart";
import { CHART, formatShortDate } from "@/lib/admin-charts";
import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";
import {
  AnalyticsHealthStrip,
  AnalyticsWarnings,
  SocialRangePicker,
} from "@/components/admin/AnalyticsShared";
import { applyAnalyticsUrlParams } from "@/lib/analytics-ranges";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

function formatPct(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function AdminAnalyticsOverview({
  initialData = null,
}: {
  initialData?: AnalyticsOverviewReport | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState<RangeValue>(
    initialRange && RANGES.some((r) => r.value === initialRange)
      ? (initialRange as RangeValue)
      : "30d"
  );
  const [data, setData] = useState<AnalyticsOverviewReport | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  function syncRange(value: RangeValue) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    applyAnalyticsUrlParams(params, "overview", value);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
  }

  function loadData() {
    setLoading(true);
    setError("");
    fetch(`/api/admin/analytics/overview?range=${range}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load overview");
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (initialData && initialData.range === range) {
      setData(initialData);
      setLoading(false);
      return;
    }
    loadData();
  }, [range, initialData]);

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={loadData} className="admin-link-accent mt-4 block w-full">
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) return <AdminSkeleton rows={6} />;
  if (!data) return null;

  const snapshotTrend = data.snapshots.map((row) => ({
    label: formatShortDate(row.date),
    clicks: row.payload.outboundClicks,
    users: row.payload.siteUsers ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AnalyticsHealthStrip health={data.health} fetchedAt={data.fetchedAt} onRefresh={loadData} />
      <AnalyticsWarnings warnings={data.warnings} />

      <SocialRangePicker range={range} onChange={syncRange} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Site users"
          value={data.site?.users}
          sub={formatPct(data.site?.usersChangePct ?? null) + " vs prior period"}
          href="/admin/analytics?tab=traffic"
        />
        <OverviewCard
          label="Outbound clicks"
          value={data.clicks.rangeClicks}
          sub={`${data.clicks.todayClicks} today`}
          href="/admin/analytics?tab=clicks"
        />
        <OverviewCard
          label="Instagram reach"
          value={data.instagram?.totalReach}
          sub={
            data.instagram
              ? `${data.instagram.followersCount.toLocaleString()} followers`
              : "Not configured"
          }
          href="/admin/analytics?tab=instagram"
        />
        <OverviewCard
          label="Facebook reach"
          value={data.facebook?.totalReach}
          sub={
            data.facebook
              ? `${data.facebook.followersCount.toLocaleString()} followers`
              : "Not configured"
          }
          href="/admin/analytics?tab=facebook"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          label="Blog page views"
          value={data.site?.blogPageViews}
          sub="From GA4"
          href="/admin/analytics?tab=traffic"
        />
        <OverviewCard
          label="Newsletter subscribers"
          value={data.newsletter.totalActive}
          sub={`+${data.newsletter.newInRange} in range`}
          href="/admin/subscribers"
        />
        <OverviewCard
          label="Reported revenue"
          value={data.clicks.conversionRevenue}
          sub={`${data.clicks.conversionCount} imported conversions`}
          href="/admin/analytics?tab=clicks"
          isCurrency
        />
        <OverviewCard
          label="Active now"
          value={data.site?.realtimeActiveUsers}
          sub="GA4 realtime"
          href="/admin/analytics?tab=traffic"
        />
      </div>

      {snapshotTrend.length > 1 && (
        <AdminChartCard
          title="Stored daily snapshots"
          description="Historical KPIs saved by the daily analytics cron job"
        >
          <MultiMetricTrendChart
            data={snapshotTrend}
            series={[
              { key: "clicks", label: "Outbound clicks", color: CHART.primary },
              { key: "users", label: "Site users", color: CHART.purple },
            ]}
            height={260}
            emptyMessage="Snapshots will appear after the daily cron runs."
          />
        </AdminChartCard>
      )}

      <p className="text-xs text-muted">
        Overview combines GA4, Meta, first-party clicks, and newsletter data. TikTok is not connected
        yet. Schedule{" "}
        <code className="text-white/80">/api/cron/analytics-snapshot</code> daily for history.
      </p>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  sub,
  href,
  isCurrency = false,
}: {
  label: string;
  value?: number | null;
  sub: string;
  href: string;
  isCurrency?: boolean;
}) {
  const display =
    value == null
      ? "—"
      : isCurrency
        ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : value.toLocaleString();

  return (
    <Link href={href} className="admin-card admin-card-pad block transition-colors hover:border-neon/30">
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value text-neon">{display}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </Link>
  );
}
