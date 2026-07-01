"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { MiniSparkline } from "@/components/admin/MiniSparkline";
import { useToast } from "@/components/admin/Toast";

interface ToolRow {
  toolId: string;
  name: string;
  slug: string;
  clicks: number;
  hasAffiliateUrl: boolean;
  published: boolean;
}

interface Analytics {
  totalClicks: number;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  rangeClicks: number;
  range: string;
  allTools: ToolRow[];
  dailyClicks: { date: string; count: number }[];
  toolDailyClicks?: { date: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  affiliateClicks: number;
  nonAffiliateClicks: number;
}

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

export function AdminAnalytics() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const initialRange = searchParams.get("range");
  const toolFilter = searchParams.get("tool") ?? "";
  const [range, setRange] = useState(
    initialRange && RANGES.some((r) => r.value === initialRange) ? initialRange : "30d"
  );
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"clicks" | "name">("clicks");
  const [zeroClicksOnly, setZeroClicksOnly] = useState(false);

  function loadAnalytics() {
    setData(null);
    setError("");
    const params = new URLSearchParams({ range });
    if (toolFilter) params.set("tool", toolFilter);
    fetch(`/api/admin/analytics?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load analytics"));
  }

  useEffect(() => {
    loadAnalytics();
  }, [range, toolFilter]);

  function exportReferrers() {
    if (!data?.referrers.length) return;
    const header = `Referrer,Clicks,Date range,${range}\n`;
    const rows = data.referrers.map((r) => `"${r.referrer}",${r.count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toolqz-referrers-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Referrers exported");
  }

  function exportCsv() {
    if (!data) return;
    const header = "Tool,Slug,Clicks,Has affiliate URL,Published\n";
    const rows = sortedTools
      .map(
        (t) =>
          `"${t.name}","${t.slug}",${t.clicks},${t.hasAffiliateUrl},${t.published}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toolqz-clicks-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button onClick={loadAnalytics} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <AdminSkeleton rows={6} />;

  const maxDaily = Math.max(...data.dailyClicks.map((d) => Number(d.count)), 1);
  const totalForShare = data.rangeClicks || data.totalClicks;

  const sortedTools = [...data.allTools]
    .filter((t) => !zeroClicksOnly || t.clicks === 0)
    .filter((t) => !toolFilter || t.slug === toolFilter || t.name.toLowerCase().includes(toolFilter.toLowerCase()))
    .sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : b.clicks - a.clicks
    );

  const filteredTool = toolFilter
    ? data.allTools.find((t) => t.slug === toolFilter)
    : null;

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";
  const statCards =
    range === "30d"
      ? [
          { key: "today", label: "Today", value: data.todayClicks },
          { key: "week", label: "Last 7 days", value: data.weekClicks },
          { key: "month", label: "Last 30 days", value: data.monthClicks },
          { key: "all-time", label: "All-time total", value: data.totalClicks },
        ]
      : [
          { key: "range", label: rangeLabel, value: data.rangeClicks },
          { key: "all-time", label: "All-time total", value: data.totalClicks },
          { key: "with-clicks", label: "Tools with clicks", value: data.allTools.filter((t) => t.clicks > 0).length },
          { key: "zero-clicks", label: "Zero-click tools", value: data.allTools.filter((t) => t.clicks === 0).length },
        ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Click Analytics</h1>
          <p className="text-muted">
            {filteredTool
              ? `Filtered to ${filteredTool.name} · clear filter below`
              : "Deep dive into Visit link performance"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(e) => {
              const v = e.target.value;
              setRange(v);
              const params = new URLSearchParams(searchParams.toString());
              if (v === "30d") params.delete("range");
              else params.set("range", v);
              router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
            }}
            className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Export tools CSV
          </button>
          {data.referrers.length > 0 && (
            <button
              onClick={exportReferrers}
              className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
            >
              Export referrers
            </button>
          )}
        </div>
      </div>

      {toolFilter && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neon/20 bg-neon/5 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing: <strong>{filteredTool?.name ?? toolFilter}</strong>
              {filteredTool && (
                <span className="text-muted">
                  {" "}
                  · {filteredTool.clicks} click{filteredTool.clicks === 1 ? "" : "s"} in range
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("tool");
                router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
              }}
              className="text-neon hover:underline"
            >
              Clear filter
            </button>
          </div>
          {data.toolDailyClicks && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Daily trend</span>
              <MiniSparkline data={data.toolDailyClicks} />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-neon">{stat.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Affiliate vs direct click totals are summed per tool in the selected range.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Clicks via affiliate URLs</p>
          <p className="mt-1 text-2xl font-bold text-neon">{data.affiliateClicks}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Clicks via direct URLs</p>
          <p className="mt-1 text-2xl font-bold">{data.nonAffiliateClicks}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <h2 className="mb-6 font-semibold">
          Clicks per day
          {data.range === "all"
            ? " (all time)"
            : data.range === "7d"
              ? " (last 7 days)"
              : data.range === "90d"
                ? " (last 90 days)"
                : " (last 30 days)"}
        </h2>
        {data.dailyClicks.length === 0 ? (
          <p className="text-sm text-muted">No click data yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {data.dailyClicks.map((day) => {
              const count = Number(day.count);
              const height = (count / maxDaily) * 100;
              return (
                <div key={day.date} className="group flex flex-1 flex-col items-center gap-1" title={`${day.date}: ${count}`}>
                  <div className="w-full rounded-t bg-neon/80 group-hover:bg-neon" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="hidden text-[10px] text-muted sm:block">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.referrers.length > 0 && (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
          <h2 className="mb-4 font-semibold">Top referrers</h2>
          <ul className="space-y-2 text-sm">
            {data.referrers.map((r) => (
              <li key={r.referrer} className="flex justify-between">
                <span className="truncate text-muted">{r.referrer}</span>
                <span className="font-semibold text-neon">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border px-6 py-4">
          <h2 className="font-semibold">
            All tools ({sortedTools.length}
            {zeroClicksOnly ? " zero-click" : ""})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={zeroClicksOnly}
                onChange={(e) => setZeroClicksOnly(e.target.checked)}
              />
              Zero clicks only
            </label>
            <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "clicks" | "name")}
            className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-sm text-white"
          >
            <option value="clicks">Sort by clicks</option>
            <option value="name">Sort by name</option>
          </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-left text-muted">
                <th className="px-6 py-3 font-medium">Tool</th>
                <th className="px-6 py-3 font-medium">Clicks</th>
                <th className="px-6 py-3 font-medium">Share</th>
                <th className="px-6 py-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {sortedTools.map((tool) => (
                <tr
                  key={tool.toolId}
                  className={`border-b border-dark-border/50 last:border-0 ${
                    toolFilter && tool.slug === toolFilter ? "bg-neon/5" : ""
                  }`}
                >
                  <td className="px-6 py-3">
                    <div>{tool.name}</div>
                    {!tool.hasAffiliateUrl && tool.published && (
                      <span className="text-xs text-amber-400">No affiliate URL</span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-semibold text-neon">{tool.clicks}</td>
                  <td className="px-6 py-3 text-muted">
                    {totalForShare > 0 ? `${((tool.clicks / totalForShare) * 100).toFixed(1)}%` : "0%"}
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/tools/${tool.toolId}`} className="text-neon hover:underline">
                      Edit
                    </Link>
                    {tool.published && (
                      <>
                        {" · "}
                        <Link href={`/tools/${tool.slug}`} target="_blank" className="text-muted hover:text-white">
                          View
                        </Link>
                      </>
                    )}
                    {!tool.published && (
                      <span className="text-xs text-muted"> · Draft</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
