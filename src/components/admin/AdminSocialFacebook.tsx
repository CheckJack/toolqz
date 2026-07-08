"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { MultiMetricTrendChart } from "@/components/admin/charts/MultiMetricTrendChart";
import { CHART, formatShortDate } from "@/lib/admin-charts";
import type { FacebookDiagnostics, FacebookReport } from "@/lib/facebook-server";
import {
  MetaTokenNote,
  PostsList,
  SocialErrorState,
  SocialNotConfigured,
  SocialRangePicker,
  StatCard,
} from "@/components/admin/AdminSocialInstagram";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

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
  reach: { date: string; value: number }[]
) {
  const dates = new Set([...impressions.map((d) => d.date), ...reach.map((d) => d.date)]);
  return [...dates]
    .sort()
    .map((date) => ({
      label: formatShortDate(date),
      impressions: impressions.find((d) => d.date === date)?.value ?? 0,
      reach: reach.find((d) => d.date === date)?.value ?? 0,
    }));
}

export function AdminSocialFacebook({
  initialData = null,
  initialStatus = null,
}: {
  initialData?: FacebookReport | null;
  initialStatus?: FacebookDiagnostics | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState<RangeValue>(
    initialRange && RANGES.some((r) => r.value === initialRange)
      ? (initialRange as RangeValue)
      : "30d"
  );
  const [data, setData] = useState<FacebookReport | null>(initialData);
  const [status, setStatus] = useState<FacebookDiagnostics | null>(initialStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialData);

  function syncRange(value: RangeValue) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "facebook");
    if (value === "30d") params.delete("range");
    else params.set("range", value);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
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
    if (initialData && initialData.range === range) {
      setData(initialData);
      setStatus(initialStatus);
      setLoading(false);
      return;
    }
    loadData();
  }, [range, initialData, initialStatus]);

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

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";
  const trend = mergeDailyTrend(data.dailyImpressions, data.dailyReach);
  const impressionsTrend = data.dailyImpressions.map((day) => ({
    label: formatShortDate(day.date),
    value: day.value,
  }));

  return (
    <div className="space-y-6">
      <SocialRangePicker range={range} onChange={syncRange} />

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
        title="Impressions & reach over time"
        description="Daily page impressions and unique reach from Facebook Page Insights"
      >
        <MultiMetricTrendChart
          data={trend}
          series={[
            { key: "impressions", label: "Impressions", color: CHART.primary },
            { key: "reach", label: "Reach", color: CHART.purple },
          ]}
          height={280}
          emptyMessage="No Facebook insights for this period yet."
        />
      </AdminChartCard>

      <AdminChartCard title="Impressions trend" description="Daily page impressions">
        <DailyAreaChart
          data={impressionsTrend}
          valueLabel="Impressions"
          color={CHART.primary}
          height={240}
          emptyMessage="No impression data for this period yet."
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
