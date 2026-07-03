"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

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

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "Last 12 months" },
] as const;

const GA4_URL = "https://analytics.google.com/";

export function AdminSiteTraffic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState(
    initialRange && RANGES.some((r) => r.value === initialRange) ? initialRange : "30d"
  );
  const [data, setData] = useState<SiteTrafficData | null>(null);
  const [error, setError] = useState("");

  function loadData() {
    setData(null);
    setError("");
    fetch(`/api/admin/site-analytics?range=${range}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load site analytics");
        }
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message || "Failed to load site analytics"));
  }

  useEffect(() => {
    loadData();
  }, [range]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button onClick={loadData} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <AdminSkeleton rows={6} />;

  if (!data.configured) {
    return (
      <div className="space-y-4 rounded-2xl border border-dark-border bg-dark-elevated p-8">
        <h2 className="text-lg font-semibold">Google Analytics not configured</h2>
        <p className="text-sm text-muted">
          Add <code className="text-white">GA4_PROPERTY_ID</code> plus either{" "}
          <code className="text-white">GA4_CREDENTIALS_JSON</code> or{" "}
          <code className="text-white">GA4_CLIENT_EMAIL</code> +{" "}
          <code className="text-white">GA4_PRIVATE_KEY</code> to your server environment, then
          redeploy.
        </p>
        <Link
          href={GA4_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-neon hover:underline"
        >
          Open Google Analytics →
        </Link>
      </div>
    );
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.pageViews), 1);
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Traffic</h1>
          <p className="text-muted">Visitors and page views from Google Analytics 4</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(e) => {
              const v = e.target.value;
              setRange(v);
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", "traffic");
              if (v === "30d") params.delete("range");
              else params.set("range", v);
              router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
            }}
            className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Link
            href={GA4_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Open GA4
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Active users ({rangeLabel.toLowerCase()})</p>
          <p className="mt-1 text-3xl font-bold text-neon">{data.users.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Sessions</p>
          <p className="mt-1 text-3xl font-bold">{data.sessions.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Page views</p>
          <p className="mt-1 text-3xl font-bold">{data.pageViews.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Active now</p>
          <p className="mt-1 text-3xl font-bold text-neon">{data.realtimeActiveUsers}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <h2 className="mb-6 font-semibold">Page views per day</h2>
        {data.daily.length === 0 ? (
          <p className="text-sm text-muted">No traffic data for this period yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {data.daily.map((day) => {
              const height = (day.pageViews / maxDaily) * 100;
              return (
                <div
                  key={day.date}
                  className="group flex flex-1 flex-col items-center gap-1"
                  title={`${day.date}: ${day.pageViews} views, ${day.users} users`}
                >
                  <div
                    className="w-full rounded-t bg-neon/80 group-hover:bg-neon"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="hidden text-[10px] text-muted sm:block">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <h2 className="mb-4 font-semibold">Top pages</h2>
          {data.topPages.length === 0 ? (
            <p className="text-sm text-muted">No page data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topPages.map((page) => (
                <li key={page.path} className="flex justify-between gap-4">
                  <span className="truncate text-muted">{page.path}</span>
                  <span className="shrink-0 font-semibold text-neon">{page.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <h2 className="mb-4 font-semibold">Top traffic sources</h2>
          {data.topSources.length === 0 ? (
            <p className="text-sm text-muted">No source data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topSources.map((source) => (
                <li key={source.source} className="flex justify-between gap-4">
                  <span className="truncate text-muted">{source.source}</span>
                  <span className="shrink-0 font-semibold text-neon">
                    {source.sessions.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">
        Data reflects visitors who accepted analytics cookies. Admin pages are excluded from the
        public GA4 tag.
      </p>
    </div>
  );
}
