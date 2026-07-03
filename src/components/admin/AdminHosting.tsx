"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

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

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed" || s === "ok") return "text-neon";
  if (s === "running" || s === "pending") return "text-amber-400";
  if (s === "failed" || s === "error") return "text-red-400";
  return "text-muted";
}

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminHosting() {
  const [data, setData] = useState<HostingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
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
          setSelectedBuild(body.latestBuild.uuid);
          loadLogsForBuild(body.latestBuild.uuid);
        }
      })
      .catch((e: Error) => setError(e.message || "Failed to load hosting data"))
      .finally(() => setLoading(false));
  }, []);

  function loadLogsForBuild(uuid: string) {
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
      .catch((e: Error) => setLogs(e.message))
      .finally(() => setLogsLoading(false));
  }

  useEffect(() => {
    load();
  }, [load]);

  function loadLogs(uuid: string) {
    loadLogsForBuild(uuid);
  }

  if (loading) return <AdminSkeleton rows={6} />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button onClick={load} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const latest = data.latestBuild;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hosting</h1>
          <p className="text-muted">Deploy status, app health, and quick links to hPanel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={data.links.hpanel}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Open hPanel
          </Link>
          <Link
            href={data.links.site}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            View live site
          </Link>
          <button
            onClick={load}
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {!data.configured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          {data.hint}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Public site</p>
          <p className={`mt-1 text-xl font-bold ${data.sitePing.ok ? "text-neon" : "text-red-400"}`}>
            {data.sitePing.ok ? `Online (${data.sitePing.status})` : "Unreachable"}
          </p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Latest deploy</p>
          <p className={`mt-1 text-xl font-bold capitalize ${statusColor(latest?.status ?? "")}`}>
            {latest?.status ?? (data.configured ? "None" : "—")}
          </p>
          {latest?.createdAt && (
            <p className="mt-1 text-xs text-muted">{formatWhen(latest.createdAt)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">Database</p>
          <p
            className={`mt-1 text-xl font-bold ${data.health.database === "ok" ? "text-neon" : "text-red-400"}`}
          >
            {data.health.database === "ok" ? "Connected" : "Error"}
          </p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <p className="text-sm text-muted">App health</p>
          <p
            className={`mt-1 text-xl font-bold capitalize ${data.health.status === "ok" ? "text-neon" : "text-amber-400"}`}
          >
            {data.health.status}
          </p>
        </div>
      </div>

      {data.website && (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5 text-sm">
          <h2 className="font-semibold">Site on Hostinger</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-muted">Domain</dt>
              <dd className="font-mono">{data.website.domain}</dd>
            </div>
            <div>
              <dt className="text-muted">Account</dt>
              <dd className="font-mono">{data.website.username}</dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd>{data.website.enabled ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            CPU, memory, and storage charts are in hPanel → Performance (not available via API on
            managed Node.js hosting).
          </p>
        </div>
      )}

      {data.health.issues.length > 0 && (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
          <h2 className="font-semibold">Configuration warnings</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-muted">
            {data.health.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
          <div className="border-b border-dark-border px-5 py-4">
            <h2 className="font-semibold">Recent deploys</h2>
          </div>
          {!data.configured ? (
            <p className="p-5 text-sm text-muted">Configure HOSTINGER_API_TOKEN to see deploy history.</p>
          ) : data.builds.length === 0 ? (
            <p className="p-5 text-sm text-muted">No deploys found.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left text-muted">
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">When</th>
                    <th className="px-4 py-2 font-medium">Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.builds.map((build) => (
                    <tr
                      key={build.uuid}
                      className={`border-b border-dark-border/50 last:border-0 ${
                        selectedBuild === build.uuid ? "bg-neon/5" : ""
                      }`}
                    >
                      <td className={`px-4 py-2 capitalize ${statusColor(build.status)}`}>
                        {build.status}
                      </td>
                      <td className="px-4 py-2 text-muted">{formatWhen(build.createdAt)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => loadLogs(build.uuid)}
                          className="text-neon hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-elevated">
          <div className="border-b border-dark-border px-5 py-4">
            <h2 className="font-semibold">Build log</h2>
            {selectedBuild && (
              <p className="mt-1 font-mono text-xs text-muted">{selectedBuild}</p>
            )}
          </div>
          <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-muted whitespace-pre-wrap">
            {logsLoading ? "Loading logs…" : logs || "Select a deploy to view its log."}
          </pre>
        </div>
      </div>
    </div>
  );
}
