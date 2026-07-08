"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { DonutBreakdownChart } from "@/components/admin/charts/DonutBreakdownChart";
import { MultiMetricTrendChart } from "@/components/admin/charts/MultiMetricTrendChart";
import type { AnalyticsHubTabId } from "@/components/admin/AdminAnalyticsHub";
import { CHART, formatShortDate, toDailyChartRows } from "@/lib/admin-charts";
import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";
import { AnalyticsHealthStrip, SocialRangePicker } from "@/components/admin/AnalyticsShared";
import { replaceAnalyticsUrl } from "@/lib/analytics-url-client";

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

function buildCombinedTrend(
  siteDaily: { date: string; users: number }[],
  clicksDaily: { date: string; count: number }[]
) {
  const dates = new Set([
    ...siteDaily.map((d) => d.date),
    ...clicksDaily.map((d) => d.date),
  ]);
  const siteMap = new Map(siteDaily.map((d) => [d.date, d.users]));
  const clickMap = new Map(clicksDaily.map((d) => [d.date, d.count]));

  return [...dates].sort().map((date) => ({
    label: formatShortDate(date),
    users: siteMap.get(date) ?? 0,
    clicks: clickMap.get(date) ?? 0,
  }));
}

export function AdminAnalyticsOverview({
  initialData = null,
  active = true,
  onNavigateTab,
}: {
  initialData?: AnalyticsOverviewReport | null;
  active?: boolean;
  onNavigateTab?: (tab: AnalyticsHubTabId) => void;
}) {
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
  const [refreshing, setRefreshing] = useState(false);

  function syncRange(value: RangeValue) {
    setRange(value);
    replaceAnalyticsUrl("overview", value);
  }

  function loadData(options?: { background?: boolean }) {
    if (options?.background) setRefreshing(true);
    else setLoading(true);
    setError("");

    fetch(`/api/admin/analytics/overview?range=${range}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load overview");
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (!active) return;
    if (initialData && initialData.range === range) {
      setData(initialData);
      setLoading(false);
      return;
    }
    if (data?.range === range) return;
    loadData();
  }, [active, range, initialData]);

  const siteTrend = useMemo(
    () =>
      (data?.trends.siteDaily ?? []).map((row) => ({
        date: row.date,
        label: formatShortDate(row.date),
        value: row.users,
      })),
    [data?.trends.siteDaily]
  );

  const clickTrend = useMemo(
    () => toDailyChartRows(data?.trends.clicksDaily ?? []),
    [data?.trends.clicksDaily]
  );

  const combinedTrend = useMemo(
    () =>
      data
        ? buildCombinedTrend(data.trends.siteDaily, data.trends.clicksDaily)
        : [],
    [data]
  );

  const channelDonut = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Site users", value: data.site?.users ?? 0, color: CHART.primary },
      { name: "Outbound clicks", value: data.clicks.rangeClicks, color: CHART.success },
      {
        name: "Instagram reach",
        value: data.instagram?.totalReach ?? 0,
        color: CHART.purple,
      },
      {
        name: "Facebook reach",
        value: data.facebook?.totalReach ?? 0,
        color: CHART.warning,
      },
    ].filter((row) => row.value > 0);
  }, [data]);

  const snapshotTrend = useMemo(
    () =>
      (data?.snapshots ?? []).map((row) => ({
        label: formatShortDate(row.date),
        clicks: row.payload.outboundClicks,
        users: row.payload.siteUsers ?? 0,
      })),
    [data?.snapshots]
  );

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={() => loadData()} className="admin-link-accent mt-4 block w-full">
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) return <AdminSkeleton rows={8} />;
  if (!data) return null;

  function goToTab(tab: AnalyticsHubTabId) {
    if (onNavigateTab) onNavigateTab(tab);
  }

  return (
    <div className="space-y-6">
      <AnalyticsHealthStrip
        health={data.health}
        fetchedAt={data.fetchedAt}
        onRefresh={() => loadData({ background: true })}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SocialRangePicker range={range} onChange={syncRange} />
        {refreshing && <span className="text-xs text-muted">Refreshing…</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat
          label="Site users"
          value={data.site?.users}
          delta={formatPct(data.site?.usersChangePct ?? null)}
          deltaLabel="vs prior period"
          highlight
          onClick={() => goToTab("traffic")}
        />
        <HeroStat
          label="Outbound clicks"
          value={data.clicks.rangeClicks}
          delta={`${data.clicks.todayClicks.toLocaleString()}`}
          deltaLabel="today"
          onClick={() => goToTab("clicks")}
        />
        <HeroStat
          label="Instagram reach"
          value={data.instagram?.totalReach}
          delta={
            data.instagram
              ? data.instagram.followersCount.toLocaleString()
              : undefined
          }
          deltaLabel={data.instagram ? "followers" : "not connected"}
          onClick={() => goToTab("instagram")}
        />
        <HeroStat
          label="Facebook reach"
          value={data.facebook?.totalReach}
          delta={
            data.facebook
              ? data.facebook.followersCount.toLocaleString()
              : undefined
          }
          deltaLabel={data.facebook ? "followers" : "not connected"}
          onClick={() => goToTab("facebook")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminChartCard
          title="Site traffic"
          description="Daily unique users from GA4"
          action={
            <button type="button" onClick={() => goToTab("traffic")} className="admin-link-accent">
              Full report
            </button>
          }
        >
          <DailyAreaChart
            data={siteTrend}
            valueLabel="Users"
            color={CHART.primary}
            height={240}
            emptyMessage="Connect GA4 to see site traffic."
          />
        </AdminChartCard>

        <AdminChartCard
          title="Outbound clicks"
          description="Visit link clicks in this range"
          action={
            <button type="button" onClick={() => goToTab("clicks")} className="admin-link-accent">
              Full report
            </button>
          }
        >
          <DailyAreaChart
            data={clickTrend}
            valueLabel="Clicks"
            color={CHART.success}
            height={240}
            emptyMessage="No outbound clicks in this range."
          />
        </AdminChartCard>

        <AdminChartCard
          title="Users vs clicks"
          description="Cross-channel daily comparison"
        >
          <MultiMetricTrendChart
            data={combinedTrend}
            series={[
              { key: "users", label: "Site users", color: CHART.primary },
              { key: "clicks", label: "Outbound clicks", color: CHART.success },
            ]}
            height={240}
            emptyMessage="Trend data will appear once GA4 and clicks are available."
          />
        </AdminChartCard>

        <AdminChartCard
          title="Channel mix"
          description="Relative volume across connected sources"
        >
          <DonutBreakdownChart
            data={channelDonut}
            valueLabel="Total"
            height={220}
            emptyMessage="Connect analytics sources to see channel mix."
          />
        </AdminChartCard>

        {snapshotTrend.length > 1 && (
          <AdminChartCard
            title="Stored snapshots"
            description="Daily KPIs from the analytics cron job"
            className="lg:col-span-2"
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChannelPanel
          title="Site & content"
          accent="bg-sky-400"
          metrics={[
            { label: "Page views", value: data.site?.pageViews },
            { label: "Blog views", value: data.site?.blogPageViews },
            { label: "Active now", value: data.site?.realtimeActiveUsers },
            { label: "Sessions", value: data.site?.sessions },
          ]}
          onOpen={() => goToTab("traffic")}
        />
        <ChannelPanel
          title="Audience & revenue"
          accent="bg-emerald-400"
          metrics={[
            { label: "Newsletter subs", value: data.newsletter.totalActive },
            { label: "New subs in range", value: data.newsletter.newInRange },
            {
              label: "Reported revenue",
              value: data.clicks.conversionRevenue,
              isCurrency: true,
            },
            { label: "Conversions imported", value: data.clicks.conversionCount },
          ]}
          onOpen={() => goToTab("clicks")}
          extraAction={{ href: "/admin/subscribers", label: "Subscribers" }}
        />
        <ChannelPanel
          title="Instagram"
          accent="bg-purple-400"
          metrics={[
            { label: "Followers", value: data.instagram?.followersCount },
            { label: "Reach", value: data.instagram?.totalReach },
            { label: "Profile views", value: data.instagram?.profileViews },
          ]}
          onOpen={() => goToTab("instagram")}
        />
        <ChannelPanel
          title="Facebook"
          accent="bg-amber-400"
          metrics={[
            { label: "Followers", value: data.facebook?.followersCount },
            { label: "Reach", value: data.facebook?.totalReach },
            { label: "Engagement", value: data.facebook?.totalEngagement },
          ]}
          onOpen={() => goToTab("facebook")}
        />
      </div>

      <div className="admin-card admin-card-pad">
        <h2 className="admin-section-title">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => goToTab("traffic")} className="admin-toolbar-btn">
            Site traffic
          </button>
          <button type="button" onClick={() => goToTab("clicks")} className="admin-toolbar-btn">
            Outbound clicks
          </button>
          <button type="button" onClick={() => goToTab("instagram")} className="admin-toolbar-btn">
            Instagram
          </button>
          <button type="button" onClick={() => goToTab("facebook")} className="admin-toolbar-btn">
            Facebook
          </button>
          <Link href="/admin/subscribers" className="admin-toolbar-btn">
            Subscribers
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  delta,
  deltaLabel,
  highlight = false,
  onClick,
}: {
  label: string;
  value?: number | null;
  delta?: string;
  deltaLabel: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  const display = value == null ? "—" : value.toLocaleString();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-card admin-card-pad w-full text-left transition hover:border-border-hover ${
        highlight ? "border-neon/20 bg-neon/5" : ""
      }`}
    >
      <p className="admin-stat-label">{label}</p>
      <p className={`admin-stat-value ${highlight ? "text-neon" : ""}`}>{display}</p>
      {delta && delta !== "—" ? (
        <p className="mt-1 text-xs text-muted">
          <span className="text-white/90">{delta}</span> {deltaLabel}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted">{deltaLabel}</p>
      )}
    </button>
  );
}

function ChannelPanel({
  title,
  accent,
  metrics,
  onOpen,
  extraAction,
}: {
  title: string;
  accent: string;
  metrics: { label: string; value?: number | null; isCurrency?: boolean }[];
  onOpen: () => void;
  extraAction?: { href: string; label: string };
}) {
  return (
    <div className="admin-card admin-card-pad">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="admin-section-title flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {extraAction && (
            <Link href={extraAction.href} className="admin-link-accent text-sm">
              {extraAction.label}
            </Link>
          )}
          <button type="button" onClick={onOpen} className="admin-link-accent text-sm">
            Open tab
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-dark-border px-3 py-3"
          >
            <p className="admin-stat-label">{metric.label}</p>
            <p className="admin-stat-value text-base">
              {metric.value == null
                ? "—"
                : metric.isCurrency
                  ? `$${metric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : metric.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
