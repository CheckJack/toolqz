"use client";

import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export type SocialRangeValue = (typeof RANGES)[number]["value"];

export function SocialRangePicker({
  range,
  onChange,
}: {
  range: SocialRangeValue;
  onChange: (value: SocialRangeValue) => void;
}) {
  return (
    <div className="admin-segmented w-fit max-w-full overflow-x-auto">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`admin-segmented-btn whitespace-nowrap ${
            range === r.value ? "admin-segmented-btn-active" : ""
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
      <p className="font-medium text-amber-100">Data warnings</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-200/90">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsHealthStrip({
  health,
  fetchedAt,
  onRefresh,
}: {
  health: AnalyticsOverviewReport["health"];
  fetchedAt?: string;
  onRefresh?: () => void;
}) {
  const items = [
    { label: "GA4", ok: health.ga4.ready },
    { label: "Instagram", ok: health.instagram.ready },
    { label: "Facebook", ok: health.facebook.ready },
    { label: "Meta token", ok: health.metaToken.valid },
  ];

  return (
    <div className="admin-card flex flex-col gap-3 admin-card-pad sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3 text-sm">
        {items.map((item) => (
          <span key={item.label} className={item.ok ? "text-emerald-400" : "text-red-400"}>
            {item.label}: {item.ok ? "✓" : "✗"}
          </span>
        ))}
        {health.metaToken.daysUntilExpiry != null && health.metaToken.valid && (
          <span className="text-muted">
            Token · {health.metaToken.daysUntilExpiry}d left
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        {fetchedAt && <span>Updated {new Date(fetchedAt).toLocaleString()}</span>}
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="admin-link-accent">
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export function exportCsv(filename: string, header: string, rows: string[]) {
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
