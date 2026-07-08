"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Search } from "lucide-react";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { DonutBreakdownChart } from "@/components/admin/charts/DonutBreakdownChart";
import { HorizontalBarChart } from "@/components/admin/charts/HorizontalBarChart";
import { useToast } from "@/components/admin/Toast";
import { CHART, toDailyChartRows, toRankChartRows } from "@/lib/admin-charts";
import type { OutboundClickAnalytics } from "@/lib/analytics-clicks";
import type { ToolCtrRow } from "@/lib/analytics-tool-ctr";
import { parseClickRange } from "@/lib/analytics-ranges";
import { replaceAnalyticsUrl } from "@/lib/analytics-url-client";

interface ToolRow {
  toolId: string;
  name: string;
  slug: string;
  clicks: number;
  hasAffiliateUrl: boolean;
  published: boolean;
}

type Analytics = OutboundClickAnalytics;

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];
type ToolView = "all" | "with" | "zero";

export function AdminAnalytics({
  initialData = null,
  toolCtrInitial = null,
  active = true,
}: {
  initialData?: Analytics | null;
  toolCtrInitial?: { configured: boolean; rows: ToolCtrRow[]; warning: string | null } | null;
  active?: boolean;
}) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(initialData);
  const initialRange = searchParams.get("range");
  const [toolFilter, setToolFilter] = useState(() => searchParams.get("tool") ?? "");
  const [range, setRange] = useState<RangeValue>(parseClickRange(initialRange) as RangeValue);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialData);
  const [sortBy, setSortBy] = useState<"clicks" | "name">("clicks");
  const [toolView, setToolView] = useState<ToolView>("all");
  const [searchInput, setSearchInput] = useState("");
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [toolCtr, setToolCtr] = useState(toolCtrInitial);

  function syncRange(value: RangeValue) {
    setRange(value);
    replaceAnalyticsUrl("clicks", value, { tool: toolFilter || null });
  }

  function loadAnalytics() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ range });
    if (toolFilter) params.set("tool", toolFilter);
    Promise.all([
      fetch(`/api/admin/analytics?${params}`).then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
      fetch(`/api/admin/analytics/tool-ctr?trafficRange=${range}&clickRange=${range}`).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([analytics, ctr]) => {
        setData(analytics);
        if (ctr) setToolCtr(ctr);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setToolFilter(searchParams.get("tool") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!active) return;
    if (initialData && initialData.range === range) {
      setData(initialData);
      if (toolCtrInitial) setToolCtr(toolCtrInitial);
      setLoading(false);
      if (!toolCtrInitial) {
        fetch(`/api/admin/analytics/tool-ctr?trafficRange=${range}&clickRange=${range}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((ctr) => ctr && setToolCtr(ctr))
          .catch(() => {});
      }
      return;
    }
    if (data?.range === range && !toolFilter) return;
    loadAnalytics();
  }, [active, range, toolFilter, initialData, toolCtrInitial]);

  async function importConversions() {
    if (!importCsv.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/analytics/conversions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: importCsv }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Import failed");
      toast(`Imported ${body.imported} conversion rows`);
      setImportCsv("");
      loadAnalytics();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed", "error");
    } finally {
      setImporting(false);
    }
  }

  function clearToolFilter() {
    setToolFilter("");
    replaceAnalyticsUrl("clicks", range, { tool: null });
  }

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

  const sortedTools = useMemo(() => {
    if (!data) return [];
    const q = searchInput.trim().toLowerCase();
    return [...data.allTools]
      .filter((t) => !toolFilter || t.slug === toolFilter)
      .filter((t) => {
        if (toolView === "with") return t.clicks > 0;
        if (toolView === "zero") return t.clicks === 0;
        return true;
      })
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      )
      .sort((a, b) =>
        sortBy === "name" ? a.name.localeCompare(b.name) : b.clicks - a.clicks
      );
  }, [data, toolView, searchInput, sortBy, toolFilter]);

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

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={loadAnalytics} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) return <AdminSkeleton rows={6} />;

  if (!data) return null;

  const totalForShare = data.rangeClicks || data.totalClicks;
  const filteredTool = toolFilter ? data.allTools.find((t) => t.slug === toolFilter) : null;
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";

  const toolCounts = {
    all: data.allTools.length,
    with: data.allTools.filter((t) => t.clicks > 0).length,
    zero: data.allTools.filter((t) => t.clicks === 0).length,
  };

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
          {
            key: "with-clicks",
            label: "Tools with clicks",
            value: toolCounts.with,
          },
          { key: "zero-clicks", label: "Zero-click tools", value: toolCounts.zero },
        ];

  const dailyChart = toDailyChartRows(data.dailyClicks);
  const topToolsChart = toRankChartRows(
    sortedTools.map((tool) => ({ name: tool.name, value: tool.clicks })),
    8
  );
  const referrersChart = toRankChartRows(
    data.referrers.map((r) => ({ name: r.referrer, value: r.count })),
    8
  );
  const clickTypeDonut = [
    { name: "Affiliate URLs", value: data.affiliateClicks, color: CHART.primary },
    { name: "Direct URLs", value: data.nonAffiliateClicks, color: CHART.muted },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="admin-toolbar-btn">
            Export tools CSV
          </button>
          {data.referrers.length > 0 && (
            <button type="button" onClick={exportReferrers} className="admin-toolbar-btn">
              Export referrers
            </button>
          )}
        </div>
      </div>

      {toolFilter && (
        <div className="admin-card flex flex-col gap-4 border-neon/20 bg-neon/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 text-sm">
            <span className="text-muted">Filtered to </span>
            <span className="font-medium text-white">{filteredTool?.name ?? toolFilter}</span>
            {filteredTool && (
              <span className="text-muted">
                {" "}
                · {filteredTool.clicks} click{filteredTool.clicks === 1 ? "" : "s"} in range
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data.toolDailyClicks && data.toolDailyClicks.length > 0 && (
              <div className="min-w-[12rem] flex-1 sm:max-w-xs">
                <DailyAreaChart
                  data={toDailyChartRows(data.toolDailyClicks)}
                  valueLabel="Clicks"
                  height={100}
                  emptyMessage="No clicks in range"
                />
              </div>
            )}
            <button type="button" onClick={clearToolFilter} className="admin-link-accent text-sm">
              Clear filter
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.key} className="admin-card admin-card-pad">
            <p className="admin-stat-label">{stat.label}</p>
            <p className="admin-stat-value text-neon">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {(data.conversionCount > 0 || data.conversionRevenue > 0) && (
        <div className="admin-card admin-card-pad">
          <p className="admin-stat-label">Imported affiliate revenue ({rangeLabel.toLowerCase()})</p>
          <p className="admin-stat-value text-neon">
            ${data.conversionRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-muted">{data.conversionCount} conversion rows imported</p>
        </div>
      )}

      {toolCtr?.configured && toolCtr.rows.length > 0 && (
        <AdminChartCard
          title="Tool click-through rate"
          description="Outbound Visit clicks ÷ GA4 tool page views in the same range"
        >
          {toolCtr.warning && <p className="mb-3 text-sm text-amber-300">{toolCtr.warning}</p>}
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th className="text-right">Page views</th>
                  <th className="text-right">Clicks</th>
                  <th className="text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {toolCtr.rows.slice(0, 15).map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <p className="font-medium text-white">{row.name}</p>
                      <p className="font-mono text-[11px] text-muted-dim">/{row.slug}</p>
                    </td>
                    <td className="text-right tabular-nums">{row.pageViews.toLocaleString()}</td>
                    <td className="text-right tabular-nums text-neon">
                      {row.clicks.toLocaleString()}
                    </td>
                    <td className="text-right tabular-nums">{row.ctr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminChartCard>
      )}

      <div className="admin-card admin-card-pad space-y-3">
        <h2 className="admin-section-title">Import affiliate conversions (CSV)</h2>
        <p className="text-sm text-muted">
          Header: <code className="text-white">date,amount,tool_slug,network,notes</code>
        </p>
        <textarea
          value={importCsv}
          onChange={(e) => setImportCsv(e.target.value)}
          rows={4}
          placeholder={"date,amount,tool_slug,network,notes\n2026-07-01,42.50,notion,Impact,"}
          className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={importConversions}
          disabled={importing || !importCsv.trim()}
          className="admin-toolbar-btn"
        >
          {importing ? "Importing…" : "Import CSV"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminChartCard
          title="Affiliate vs direct clicks"
          description="Share of outbound clicks in the selected range"
        >
          <DonutBreakdownChart data={clickTypeDonut} valueLabel="Clicks" height={240} />
        </AdminChartCard>

        {data.referrers.length > 0 ? (
          <AdminChartCard
            title="Top referrers"
            description="Where visitors came from before clicking Visit"
          >
            <HorizontalBarChart data={referrersChart} valueLabel="Clicks" height={240} />
          </AdminChartCard>
        ) : (
          <AdminChartCard title="Top referrers" description="No referrer data in this range">
            <p className="py-12 text-center text-sm text-muted">No referrer data yet.</p>
          </AdminChartCard>
        )}
      </div>

      <AdminChartCard
        title="Clicks per day"
        description={
          data.range === "all"
            ? "All-time daily outbound clicks"
            : `Daily clicks · ${rangeLabel.toLowerCase()}`
        }
      >
        <DailyAreaChart
          data={dailyChart}
          valueLabel="Clicks"
          emptyMessage="No click data yet."
          height={280}
        />
      </AdminChartCard>

      <AdminChartCard title="Top tools in range" description="Hover bars for exact click counts">
        <HorizontalBarChart
          data={topToolsChart}
          valueLabel="Clicks"
          emptyMessage="No tool clicks in this range."
          height={Math.max(240, topToolsChart.length * 36 + 48)}
        />
      </AdminChartCard>

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="admin-segmented w-fit max-w-full overflow-x-auto">
              {(
                [
                  { value: "all", label: "All tools" },
                  { value: "with", label: "With clicks" },
                  { value: "zero", label: "Zero clicks" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setToolView(tab.value)}
                  className={`admin-segmented-btn whitespace-nowrap ${
                    toolView === tab.value ? "admin-segmented-btn-active" : ""
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {toolCounts[tab.value]}
                  </span>
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "clicks" | "name")}
              className="rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:w-auto"
            >
              <option value="clicks">Sort by clicks</option>
              <option value="name">Sort by name</option>
            </select>
          </div>

          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tools…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={5} />
          </div>
        ) : sortedTools.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">No tools match your filters.</p>
            {(searchInput || toolView !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setToolView("all");
                }}
                className="admin-link-accent mt-3"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th className="text-right">Clicks</th>
                  <th className="hidden sm:table-cell text-right">Share</th>
                  <th className="w-12" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sortedTools.map((tool) => (
                  <tr
                    key={tool.toolId}
                    className={toolFilter && tool.slug === toolFilter ? "bg-neon/5" : ""}
                  >
                    <td className="min-w-[12rem]">
                      <p className="font-medium text-white">{tool.name}</p>
                      <p className="font-mono text-[11px] text-muted-dim">/{tool.slug}</p>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                        {!tool.published && <span className="text-muted">Draft</span>}
                        {!tool.hasAffiliateUrl && tool.published && (
                          <span className="text-amber-400">No affiliate URL</span>
                        )}
                        <span className="text-muted sm:hidden">
                          {totalForShare > 0
                            ? `${((tool.clicks / totalForShare) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-semibold tabular-nums text-neon">
                      {tool.clicks.toLocaleString()}
                    </td>
                    <td className="hidden text-right tabular-nums text-muted sm:table-cell">
                      {totalForShare > 0
                        ? `${((tool.clicks / totalForShare) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                    <td className="w-12 text-right">
                      <AnalyticsToolRowActions tool={tool} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Affiliate vs direct click totals are summed per tool in the selected range.
      </p>
    </div>
  );
}

function AnalyticsToolRowActions({ tool }: { tool: ToolRow }) {
  return (
    <AdminRowActionsMenu label={`Actions for ${tool.name}`}>
      {(close) => (
        <>
          <Link
            href={`/admin/tools/${tool.toolId}`}
            role="menuitem"
            onClick={close}
            className="admin-menu-item"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit tool
          </Link>
          {tool.published && (
            <Link
              href={`/tools/${tool.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              View on site
            </Link>
          )}
        </>
      )}
    </AdminRowActionsMenu>
  );
}
