"use client";

import Link from "next/link";
import { ExternalLink, RefreshCw, Rocket, Server } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DeployActivityChart } from "@/components/admin/charts/MultiMetricTrendChart";
import { DonutBreakdownChart } from "@/components/admin/charts/DonutBreakdownChart";
import { useToast } from "@/components/admin/Toast";
import { buildDeployActivityChart, buildDeployStatusDonut } from "@/lib/admin-charts";

interface HostingerBuild {
  uuid: string;
  status: string;
  createdAt: string;
}

interface HostingData {
  configured: boolean;
  domain: string;
  hint?: string;
  sitePing: { ok: boolean; status: number };
  health: {
    status: string;
    database: string;
    databaseError: string | null;
    emailConfigured: boolean;
    issues: string[];
  };
  website: { username: string; domain: string; enabled: boolean } | null;
  builds: HostingerBuild[];
  latestBuild: HostingerBuild | null;
  links: { hpanel: string; site: string };
}

type DeployTab = "all" | "completed" | "failed" | "other";

const DEPLOY_TABS: { value: DeployTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "other", label: "In progress" },
];

function normalizeStatus(status: string): DeployTab {
  const s = status.toLowerCase();
  if (s === "completed" || s === "ok") return "completed";
  if (s === "failed" || s === "error") return "failed";
  return "other";
}

function statusBadgeClass(status: string): string {
  const bucket = normalizeStatus(status);
  if (bucket === "completed") return "bg-emerald-500/10 text-emerald-400";
  if (bucket === "failed") return "bg-red-400/10 text-red-400";
  if (bucket === "other") return "bg-amber-400/10 text-amber-400";
  return "bg-dark-border/80 text-muted";
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function statusValueTone(status: string): string {
  const bucket = normalizeStatus(status);
  if (bucket === "completed") return "text-emerald-400";
  if (bucket === "failed") return "text-red-400";
  if (bucket === "other") return "text-amber-400";
  return "text-muted";
}
function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminHosting() {
  const { toast } = useToast();
  const [data, setData] = useState<HostingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deployFilter, setDeployFilter] = useState<DeployTab>("all");
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  const loadLogsForBuild = useCallback((uuid: string) => {
    setSelectedBuild(uuid);
    setLogsLoading(true);
    setLogs("");
    fetch(`/api/admin/hosting?logs=${encodeURIComponent(uuid)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load logs");
        }
        return r.json();
      })
      .then((body) => setLogs(body.logs ?? ""))
      .catch((e: Error) => {
        setLogs(e.message);
        toast(e.message || "Failed to load logs", "error");
      })
      .finally(() => setLogsLoading(false));
  }, [toast]);

  const load = useCallback(
    (options?: { silent?: boolean }) => {
      if (options?.silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      fetch("/api/admin/hosting")
        .then(async (r) => {
          if (!r.ok) {
            const body = await r.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to load hosting data");
          }
          return r.json();
        })
        .then((body: HostingData) => {
          setData(body);
          if (body.latestBuild?.uuid && body.configured) {
            loadLogsForBuild(body.latestBuild.uuid);
          } else {
            setSelectedBuild(null);
            setLogs("");
          }
          if (options?.silent) toast("Hosting data refreshed");
        })
        .catch((e: Error) => {
          const msg = e.message || "Failed to load hosting data";
          setError(msg);
          if (options?.silent) toast(msg, "error");
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [loadLogsForBuild, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const deployCounts = useMemo(() => {
    const builds = data?.builds ?? [];
    return {
      all: builds.length,
      completed: builds.filter((b) => normalizeStatus(b.status) === "completed").length,
      failed: builds.filter((b) => normalizeStatus(b.status) === "failed").length,
      other: builds.filter((b) => normalizeStatus(b.status) === "other").length,
    };
  }, [data?.builds]);

  const filteredBuilds = useMemo(() => {
    const builds = data?.builds ?? [];
    if (deployFilter === "all") return builds;
    return builds.filter((build) => normalizeStatus(build.status) === deployFilter);
  }, [data?.builds, deployFilter]);

  function tabCount(value: DeployTab): number {
    return deployCounts[value];
  }

  if (loading && !data) return <AdminSkeleton rows={8} />;

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={() => load()} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const latest = data.latestBuild;
  const deployTrend = buildDeployActivityChart(data.builds);
  const deployDonut = buildDeployStatusDonut(data.builds);

  const description = data.configured
    ? latest
      ? `${data.domain} · Latest deploy ${statusLabel(latest.status).toLowerCase()}`
      : `${data.domain} · No deploy history yet`
    : `${data.domain} · Hostinger API not configured`;

  const stats = [
    {
      label: "Public site",
      value: data.sitePing.ok ? `Online (${data.sitePing.status})` : "Unreachable",
      tone: data.sitePing.ok ? "text-neon" : "text-red-400",
    },
    {
      label: "Latest deploy",
      value: latest?.status ? statusLabel(latest.status) : data.configured ? "None" : "—",
      tone: latest ? statusValueTone(latest.status) : "text-muted",
      sub: latest?.createdAt ? formatWhen(latest.createdAt) : undefined,
    },
    {
      label: "Database",
      value: data.health.database === "ok" ? "Connected" : "Error",
      tone: data.health.database === "ok" ? "text-neon" : "text-red-400",
    },
    {
      label: "App health",
      value: data.health.status,
      tone: data.health.status === "ok" ? "text-neon" : "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Hosting"
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="admin-toolbar-btn disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 shrink-0 opacity-70 ${refreshing ? "animate-spin" : ""}`}
                strokeWidth={1.75}
              />
              Refresh
            </button>
            <Link
              href={data.links.hpanel}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-toolbar-btn"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              hPanel
            </Link>
            <Link
              href={data.links.site}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={1.75} />
              Live site
            </Link>
          </div>
        }
      />

      {!data.configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {data.hint}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card admin-card-pad">
            <p className="admin-stat-label">{stat.label}</p>
            <p className={`admin-stat-value capitalize ${stat.tone}`}>{stat.value}</p>
            {stat.sub && <p className="mt-1 text-[11px] text-muted-dim">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {data.website && (
        <div className="admin-card admin-card-pad">
          <h2 className="admin-section-title">Site on Hostinger</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-[12px] text-muted">Domain</dt>
              <dd className="mt-1 font-mono text-sm text-white">{data.website.domain}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Account</dt>
              <dd className="mt-1 font-mono text-sm text-white">{data.website.username}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    data.website.enabled
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-dark-border/80 text-muted"
                  }`}
                >
                  {data.website.enabled ? "Enabled" : "Disabled"}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-muted">
            CPU, memory, and storage charts are in hPanel → Performance (not available via API on
            managed Node.js hosting).
          </p>
        </div>
      )}

      {data.health.issues.length > 0 && (
        <div className="admin-card admin-card-pad border-amber-500/25 bg-amber-500/5">
          <h2 className="admin-section-title">Configuration warnings</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-amber-100/90">
            {data.health.issues.map((issue) => (
              <li key={issue} className="flex gap-2">
                <span className="text-amber-400">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
          {!data.health.emailConfigured && (
            <p className="mt-3 text-[12px] text-muted">
              Email is not configured — follow-up reminders and newsletter flows may not send.
            </p>
          )}
        </div>
      )}

      {data.configured && data.builds.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminChartCard
            title="Deploy activity"
            description="Stacked deploy outcomes by day"
            className="lg:col-span-2"
          >
            <DeployActivityChart data={deployTrend} />
          </AdminChartCard>

          <AdminChartCard title="Deploy outcomes" description="Completed vs failed vs in progress">
            <DonutBreakdownChart data={deployDonut} valueLabel="Deploys" height={260} />
          </AdminChartCard>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card overflow-hidden">
          <div className="border-b border-dark-border p-4 sm:p-5">
            <h2 className="admin-section-title">Recent deploys</h2>
            {!data.configured && (
              <p className="mt-1 text-[12px] text-muted">
                Configure HOSTINGER_API_TOKEN to see deploy history.
              </p>
            )}
          </div>

          {!data.configured ? (
            <div className="px-4 py-12 text-center sm:px-5">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
                <Rocket className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-muted">Deploy history unavailable without API token.</p>
            </div>
          ) : data.builds.length === 0 ? (
            <div className="px-4 py-12 text-center sm:px-5">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
                <Rocket className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-muted">No deploys found yet.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-dark-border px-4 py-3 sm:px-5">
                <div className="admin-segmented w-fit max-w-full overflow-x-auto">
                  {DEPLOY_TABS.map((tab) => {
                    const active = deployFilter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setDeployFilter(tab.value)}
                        className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                      >
                        {tab.label}
                        <span className="ml-1.5 tabular-nums opacity-70">{tabCount(tab.value)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredBuilds.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-5">
                  <p className="text-sm text-muted">No deploys in this filter.</p>
                  <button
                    type="button"
                    onClick={() => setDeployFilter("all")}
                    className="admin-link-accent mt-3"
                  >
                    Show all deploys
                  </button>
                </div>
              ) : (
                <div className="max-h-80 overflow-x-auto overflow-y-auto">
                  <table className="admin-table min-w-[20rem]">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>When</th>
                        <th className="w-24 text-right">Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuilds.map((build) => {
                        const selected = selectedBuild === build.uuid;
                        return (
                          <tr
                            key={build.uuid}
                            className={`cursor-pointer ${selected ? "bg-neon/5" : ""}`}
                            onClick={() => loadLogsForBuild(build.uuid)}
                          >
                            <td>
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(build.status)}`}
                              >
                                {statusLabel(build.status)}
                              </span>
                            </td>
                            <td className="text-muted">{formatWhen(build.createdAt)}</td>
                            <td className="text-right">
                              <span
                                className={`text-[12px] ${selected ? "text-neon" : "text-muted"}`}
                              >
                                {selected ? "Viewing" : "View"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="admin-card overflow-hidden">
          <div className="border-b border-dark-border p-4 sm:p-5">
            <h2 className="admin-section-title">Build log</h2>
            {selectedBuild ? (
              <p className="mt-1 truncate font-mono text-[11px] text-muted-dim">{selectedBuild}</p>
            ) : (
              <p className="mt-1 text-[12px] text-muted">Select a deploy to view its output.</p>
            )}
          </div>
          <div className="relative max-h-80 min-h-[12rem] overflow-auto bg-dark/40 p-4">
            {!selectedBuild ? (
              <div className="flex h-full min-h-[10rem] flex-col items-center justify-center text-center">
                <Server className="mb-2 h-5 w-5 text-muted-dim" strokeWidth={1.75} />
                <p className="text-sm text-muted">No deploy selected</p>
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed text-muted whitespace-pre-wrap">
                {logsLoading ? "Loading logs…" : logs || "No log output for this deploy."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
