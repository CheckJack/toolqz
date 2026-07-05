"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { HorizontalBarChart } from "@/components/admin/charts/HorizontalBarChart";
import { MultiMetricTrendChart } from "@/components/admin/charts/MultiMetricTrendChart";
import { CHART, formatShortDate, toRankChartRows } from "@/lib/admin-charts";

interface SiteTrafficData {
  configured: boolean;
  range: string;
  users: number;
  sessions: number;
  pageViews: number;
  realtimeActiveUsers: number;
  daily: { date: string; users: number; sessions: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
  topSources: { source: string; sessions: number }[];
}

interface Ga4Status {
  propertyId: boolean;
  credentialSource: string;
  clientEmail: string | null;
  privateKeyValid: boolean;
  ready: boolean;
  hint: string | null;
}

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "12 months" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

const GA4_URL = "https://analytics.google.com/";

export function AdminSiteTraffic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState<RangeValue>(
    initialRange && RANGES.some((r) => r.value === initialRange)
      ? (initialRange as RangeValue)
      : "30d"
  );
  const [data, setData] = useState<SiteTrafficData | null>(null);
  const [status, setStatus] = useState<Ga4Status | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function syncRange(value: RangeValue) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "traffic");
    if (value === "30d") params.delete("range");
    else params.set("range", value);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
  }

  function loadData() {
    setLoading(true);
    setError("");
    setStatus(null);

    fetch("/api/admin/site-analytics/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => body && setStatus(body))
      .catch(() => {});

    fetch(`/api/admin/site-analytics?range=${range}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load site analytics");
        }
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message || "Failed to load site analytics"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [range]);

  if (error && !data) {
    const isConfig =
      error.includes("PEM") ||
      error.includes("private key") ||
      error.includes("GA4_") ||
      error.includes("malformed");
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        <p>{error}</p>
        {status && (
          <div className="admin-card mt-4 admin-card-pad text-left text-sm text-muted">
            <p>Property ID: {status.propertyId ? "✓ set" : "✗ missing"}</p>
            <p>Credential source: {status.credentialSource}</p>
            <p>Private key valid: {status.privateKeyValid ? "✓ yes" : "✗ no"}</p>
            {status.clientEmail && <p>Service account: {status.clientEmail}</p>}
          </div>
        )}
        {isConfig && (
          <div className="mt-3 space-y-2 text-left text-sm text-muted">
            <p className="font-medium text-white">Fix on Hostinger:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Delete <code className="text-white">GA4_PRIVATE_KEY</code> and{" "}
                <code className="text-white">GA4_CLIENT_EMAIL</code> if present.
              </li>
              <li>
                On your Mac run:{" "}
                <code className="text-white">
                  npm run ga4:env -- ~/Downloads/toolqz-analytics-dc7a4502a703.json
                </code>
              </li>
              <li>
                Paste <code className="text-white">GA4_CREDENTIALS_BASE64</code> into Hostinger env
                vars (keep <code className="text-white">GA4_PROPERTY_ID=544145954</code>).
              </li>
              <li>Redeploy the Node.js app.</li>
            </ol>
          </div>
        )}
        <button type="button" onClick={loadData} className="admin-link-accent mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) return <AdminSkeleton rows={6} />;

  if (!data) return null;

  if (!data.configured) {
    return (
      <div className="admin-card admin-card-pad space-y-4">
        <h2 className="admin-section-title">Google Analytics not configured</h2>
        <p className="text-sm text-muted">
          Add <code className="text-white">GA4_PROPERTY_ID</code> plus either{" "}
          <code className="text-white">GA4_CREDENTIALS_JSON</code> or{" "}
          <code className="text-white">GA4_CLIENT_EMAIL</code> +{" "}
          <code className="text-white">GA4_PRIVATE_KEY</code> to your server environment, then
          redeploy.
        </p>
        <Link href={GA4_URL} target="_blank" rel="noopener noreferrer" className="admin-link-accent">
          Open Google Analytics →
        </Link>
      </div>
    );
  }

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";
  const trafficTrend = data.daily.map((day) => ({
    label: formatShortDate(day.date),
    users: day.users,
    sessions: day.sessions,
    pageViews: day.pageViews,
  }));
  const topPagesChart = toRankChartRows(
    data.topPages.map((page) => ({ name: page.path, value: page.views })),
    8
  );
  const topSourcesChart = toRankChartRows(
    data.topSources.map((source) => ({ name: source.source, value: source.sessions })),
    8
  );

  return (
    <div className="space-y-6">
      <div className="admin-segmented w-fit max-w-full overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => syncRange(r.value)}
            className={`admin-segmented-btn whitespace-nowrap ${
              range === r.value ? "admin-segmented-btn-active" : ""
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-card admin-card-pad">
          <p className="admin-stat-label">Active users ({rangeLabel.toLowerCase()})</p>
          <p className="admin-stat-value text-neon">{data.users.toLocaleString()}</p>
        </div>
        <div className="admin-card admin-card-pad">
          <p className="admin-stat-label">Sessions</p>
          <p className="admin-stat-value">{data.sessions.toLocaleString()}</p>
        </div>
        <div className="admin-card admin-card-pad">
          <p className="admin-stat-label">Page views</p>
          <p className="admin-stat-value">{data.pageViews.toLocaleString()}</p>
        </div>
        <div className="admin-card admin-card-pad border-neon/20 bg-neon/5">
          <p className="admin-stat-label">Active now</p>
          <p className="admin-stat-value text-neon">{data.realtimeActiveUsers}</p>
        </div>
      </div>

      <AdminChartCard
        title="Traffic over time"
        description="Daily users, sessions, and page views from GA4"
      >
        <MultiMetricTrendChart
          data={trafficTrend}
          series={[
            { key: "pageViews", label: "Page views", color: CHART.primary },
            { key: "sessions", label: "Sessions", color: CHART.success },
            { key: "users", label: "Users", color: CHART.purple },
          ]}
          height={300}
          emptyMessage="No traffic data for this period yet."
        />
      </AdminChartCard>

      <AdminChartCard title="Page views trend" description="Daily page views">
        <DailyAreaChart
          data={trafficTrend.map((row) => ({ label: row.label, value: row.pageViews }))}
          valueLabel="Page views"
          height={240}
          emptyMessage="No traffic data for this period yet."
        />
      </AdminChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminChartCard title="Top pages">
          <HorizontalBarChart
            data={topPagesChart}
            valueLabel="Views"
            emptyMessage="No page data yet."
            height={Math.max(240, topPagesChart.length * 36 + 48)}
          />
        </AdminChartCard>

        <AdminChartCard title="Top traffic sources">
          <HorizontalBarChart
            data={topSourcesChart}
            valueLabel="Sessions"
            emptyMessage="No source data yet."
            height={Math.max(240, topSourcesChart.length * 36 + 48)}
          />
        </AdminChartCard>
      </div>

      <p className="text-xs text-muted">
        Data reflects visitors who accepted analytics cookies. Admin pages are excluded from the
        public GA4 tag.
      </p>
    </div>
  );
}
