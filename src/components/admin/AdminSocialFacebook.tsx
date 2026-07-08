"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { MultiMetricTrendChart } from "@/components/admin/charts/MultiMetricTrendChart";
import { CHART, formatShortDate } from "@/lib/admin-charts";
import {
  exportCsv,
  SocialRangePicker,
  type SocialRangeValue,
} from "@/components/admin/AnalyticsShared";
import { replaceAnalyticsUrl } from "@/lib/analytics-url-client";
import type { FacebookDiagnostics, FacebookReport } from "@/lib/facebook-server";
import {
  MetaTokenNote,
  PostsList,
  SocialErrorState,
  SocialNotConfigured,
  StatCard,
} from "@/components/admin/AdminSocialInstagram";

const FACEBOOK_URL = "https://www.facebook.com/toolqz";

function truncateText(text: string, max = 120): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function formatPostDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mergeDailyTrend(
  impressions: { date: string; value: number }[],
  reach: { date: string; value: number }[],
  engagement: { date: string; value: number }[]
) {
  const dates = new Set([
    ...impressions.map((d) => d.date),
    ...reach.map((d) => d.date),
    ...engagement.map((d) => d.date),
  ]);
  return [...dates]
    .sort()
    .map((date) => ({
      label: formatShortDate(date),
      impressions: impressions.find((d) => d.date === date)?.value ?? 0,
      reach: reach.find((d) => d.date === date)?.value ?? 0,
      engagement: engagement.find((d) => d.date === date)?.value ?? 0,
    }));
}

export function AdminSocialFacebook({
  initialData = null,
  initialStatus = null,
  active = true,
}: {
  initialData?: FacebookReport | null;
  initialStatus?: FacebookDiagnostics | null;
  active?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState<SocialRangeValue>(
    initialRange === "7d" || initialRange === "90d"
      ? initialRange
      : initialRange === "all"
        ? "90d"
        : "30d"
  );
  const [data, setData] = useState<FacebookReport | null>(initialData);
  const [status, setStatus] = useState<FacebookDiagnostics | null>(initialStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialData);

  function syncRange(value: SocialRangeValue) {
    setRange(value);
    replaceAnalyticsUrl("facebook", value);
  }

  function loadData() {
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    Promise.all([
      fetch("/api/admin/social/facebook/status", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => body && setStatus(body))
        .catch(() => {}),
      fetch(`/api/admin/social/facebook?range=${range}`, { signal: controller.signal })
        .then(async (r) => {
          if (!r.ok) {
            const body = await r.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to load Facebook data");
          }
          return r.json();
        })
        .then(setData)
        .catch((e: Error) => {
          if (e.name === "AbortError") {
            setError("Request timed out. Check that the server is running, then retry.");
          } else {
            setError(e.message || "Failed to load Facebook data");
          }
        }),
    ]).finally(() => {
      window.clearTimeout(timeout);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!active) return;
    if (initialData && initialData.range === range) {
      setData(initialData);
      setStatus(initialStatus);
      setLoading(false);
      return;
    }
    if (data?.range === range) return;
    loadData();
  }, [active, range, initialData, initialStatus]);

  if (error && !data) {
    return (
      <SocialErrorState
        error={error}
        statusHint={status?.hint}
        onRetry={loadData}
        envHint={
          <>
            <li>
              <code className="text-white">META_PAGE_ACCESS_TOKEN</code> — Page token from Graph
              API Explorer (<code className="text-white">me/accounts</code>)
            </li>
            <li>
              <code className="text-white">FACEBOOK_PAGE_ID</code> — e.g.{" "}
              <code className="text-white">1191746430689782</code>
            </li>
          </>
        }
        statusLabels={[
          { label: "Page token", ok: status?.pageAccessToken },
          { label: "Facebook Page ID", ok: status?.facebookPageId },
        ]}
      />
    );
  }

  if (loading && !data) return <AdminSkeleton rows={6} />;
  if (!data) return null;

  if (!data.configured) {
    return (
      <SocialNotConfigured
        title="Facebook not configured"
        hint={status?.hint}
        linkHref={FACEBOOK_URL}
        linkLabel="Open Toolqz on Facebook →"
        envVars={["META_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"]}
      />
    );
  }

  const rangeLabel =
    range === "7d" ? "7 days" : range === "90d" ? "90 days" : "30 days";
  const report = data;
  const trend = mergeDailyTrend(
    report.dailyImpressions,
    report.dailyReach,
    report.dailyEngagement
  );

  function exportPostsCsv() {
    const header = "Date,Message,Likes,Comments,Shares,URL\n";
    const rows = report.posts.map((post) =>
      [
        formatPostDate(post.timestamp),
        `"${post.message.replace(/"/g, '""')}"`,
        post.likeCount,
        post.commentsCount,
        post.shareCount,
        post.permalink,
      ].join(",")
    );
    exportCsv(`toolqz-facebook-${range}.csv`, header, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SocialRangePicker range={range} onChange={syncRange} />
        <button type="button" onClick={exportPostsCsv} className="admin-toolbar-btn">
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Followers" value={data.followersCount} accent />
        <StatCard label={`Impressions (${rangeLabel.toLowerCase()})`} value={data.totalImpressions} />
        <StatCard label={`Reach (${rangeLabel.toLowerCase()})`} value={data.totalReach} />
        <StatCard label={`Engagement (${rangeLabel.toLowerCase()})`} value={data.totalEngagement} />
      </div>

      {data.pageName && (
        <p className="text-sm text-muted">
          Connected page: <span className="text-white">{data.pageName}</span>
        </p>
      )}

      <AdminChartCard
        title="Impressions, reach & engagement"
        description="Daily Facebook Page Insights"
      >
        <MultiMetricTrendChart
          data={trend}
          series={[
            { key: "impressions", label: "Impressions", color: CHART.primary },
            { key: "reach", label: "Reach", color: CHART.purple },
            { key: "engagement", label: "Engagement", color: CHART.success },
          ]}
          height={280}
          emptyMessage="No Facebook insights for this period yet."
        />
      </AdminChartCard>

      <PostsList
        title="Recent posts"
        emptyMessage="No posts returned from the API yet."
        onRefresh={loadData}
        items={data.posts.map((post) => ({
          id: post.id,
          text: truncateText(post.message) || "No message",
          date: formatPostDate(post.timestamp),
          meta: [
            `${post.likeCount} likes`,
            `${post.commentsCount} comments`,
            `${post.shareCount} shares`,
          ],
          thumbnailUrl: post.thumbnailUrl,
          fallbackLabel: "Post",
          permalink: post.permalink,
        }))}
      />

      <MetaTokenNote />
    </div>
  );
}
