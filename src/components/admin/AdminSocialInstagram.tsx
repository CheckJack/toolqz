"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DailyAreaChart } from "@/components/admin/charts/DailyAreaChart";
import { CHART, formatShortDate } from "@/lib/admin-charts";
import type { InstagramDiagnostics, InstagramReport } from "@/lib/instagram-server";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

const INSTAGRAM_URL = "https://www.instagram.com/toolqz";

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

export function AdminSocialInstagram({
  initialData = null,
  initialStatus = null,
}: {
  initialData?: InstagramReport | null;
  initialStatus?: InstagramDiagnostics | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRange = searchParams.get("range");
  const [range, setRange] = useState<RangeValue>(
    initialRange && RANGES.some((r) => r.value === initialRange)
      ? (initialRange as RangeValue)
      : "30d"
  );
  const [data, setData] = useState<InstagramReport | null>(initialData);
  const [status, setStatus] = useState<InstagramDiagnostics | null>(initialStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialData);

  function syncRange(value: RangeValue) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "instagram");
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
      fetch("/api/admin/social/instagram/status", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => body && setStatus(body))
        .catch(() => {}),
      fetch(`/api/admin/social/instagram?range=${range}`, { signal: controller.signal })
        .then(async (r) => {
          if (!r.ok) {
            const body = await r.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to load Instagram data");
          }
          return r.json();
        })
        .then(setData)
        .catch((e: Error) => {
          if (e.name === "AbortError") {
            setError("Request timed out. Check that the server is running, then retry.");
          } else {
            setError(e.message || "Failed to load Instagram data");
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
              <code className="text-white">INSTAGRAM_BUSINESS_ACCOUNT_ID</code> — e.g.{" "}
              <code className="text-white">17841417213421815</code>
            </li>
          </>
        }
        statusLabels={[
          { label: "Page token", ok: status?.pageAccessToken },
          { label: "Instagram account ID", ok: status?.instagramAccountId },
        ]}
      />
    );
  }

  if (loading && !data) return <AdminSkeleton rows={6} />;
  if (!data) return null;

  if (!data.configured) {
    return (
      <SocialNotConfigured
        title="Instagram not configured"
        hint={status?.hint}
        linkHref={INSTAGRAM_URL}
        linkLabel="Open @toolqz on Instagram →"
        envVars={["META_PAGE_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"]}
      />
    );
  }

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "In range";
  const reachTrend = data.dailyReach.map((day) => ({
    label: formatShortDate(day.date),
    value: day.value,
  }));

  return (
    <div className="space-y-6">
      <SocialRangePicker range={range} onChange={syncRange} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Followers" value={data.followersCount} accent />
        <StatCard label="Posts" value={data.mediaCount} />
        <StatCard label={`Reach (${rangeLabel.toLowerCase()})`} value={data.totalReach} />
        <StatCard
          label={`Profile views (${rangeLabel.toLowerCase()})`}
          value={data.profileViews ?? "—"}
        />
      </div>

      {data.username && (
        <p className="text-sm text-muted">
          Connected account: <span className="text-white">@{data.username}</span>
        </p>
      )}

      <AdminChartCard title="Reach over time" description="Daily unique accounts that saw your content">
        <DailyAreaChart
          data={reachTrend}
          valueLabel="Reach"
          color={CHART.purple}
          height={260}
          emptyMessage="No reach data for this period yet."
        />
      </AdminChartCard>

      <PostsList
        title="Recent posts"
        emptyMessage="No posts returned from the API yet."
        onRefresh={loadData}
        items={data.media.map((post) => ({
          id: post.id,
          text: truncateText(post.caption) || "No caption",
          date: formatPostDate(post.timestamp),
          meta: [post.mediaType, `${post.likeCount} likes`, `${post.commentsCount} comments`],
          thumbnailUrl: post.thumbnailUrl,
          fallbackLabel: post.mediaType.slice(0, 4),
          permalink: post.permalink,
        }))}
      />

      <MetaTokenNote />
    </div>
  );
}

function SocialRangePicker({
  range,
  onChange,
}: {
  range: RangeValue;
  onChange: (value: RangeValue) => void;
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

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="admin-card admin-card-pad">
      <p className="admin-stat-label">{label}</p>
      <p className={`admin-stat-value ${accent ? "text-neon" : ""}`}>{display}</p>
    </div>
  );
}

function SocialNotConfigured({
  title,
  hint,
  linkHref,
  linkLabel,
  envVars,
}: {
  title: string;
  hint?: string | null;
  linkHref: string;
  linkLabel: string;
  envVars: string[];
}) {
  return (
    <div className="admin-card admin-card-pad space-y-4">
      <h2 className="admin-section-title">{title}</h2>
      <p className="text-sm text-muted">
        Add{" "}
        {envVars.map((v, i) => (
          <span key={v}>
            {i > 0 && " and "}
            <code className="text-white">{v}</code>
          </span>
        ))}{" "}
        to your server environment, then redeploy.
      </p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <Link href={linkHref} target="_blank" rel="noopener noreferrer" className="admin-link-accent">
        {linkLabel}
      </Link>
    </div>
  );
}

function SocialErrorState({
  error,
  statusHint,
  onRetry,
  envHint,
  statusLabels,
}: {
  error: string;
  statusHint?: string | null;
  onRetry: () => void;
  envHint: ReactNode;
  statusLabels: { label: string; ok?: boolean }[];
}) {
  const isConfig =
    error.includes("META_") ||
    error.includes("INSTAGRAM_") ||
    error.includes("FACEBOOK_") ||
    error.includes("not set");

  return (
    <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
      <p>{error}</p>
      {statusLabels.length > 0 && (
        <div className="admin-card mt-4 admin-card-pad text-left text-sm text-muted">
          {statusLabels.map((item) => (
            <p key={item.label}>
              {item.label}: {item.ok ? "✓ set" : "✗ missing"}
            </p>
          ))}
          {statusHint && <p className="mt-2">{statusHint}</p>}
        </div>
      )}
      {isConfig && (
        <div className="mt-3 space-y-2 text-left text-sm text-muted">
          <p className="font-medium text-white">Add to Hostinger env vars:</p>
          <ul className="list-disc space-y-1 pl-5">{envHint}</ul>
          <p className="text-xs">
            Page tokens expire (~60 days). Regenerate in Graph API Explorer when data stops loading.
          </p>
        </div>
      )}
      <button type="button" onClick={onRetry} className="admin-link-accent mt-4">
        Retry
      </button>
    </div>
  );
}

function PostsList({
  title,
  emptyMessage,
  onRefresh,
  items,
}: {
  title: string;
  emptyMessage: string;
  onRefresh: () => void;
  items: {
    id: string;
    text: string;
    date: string;
    meta: string[];
    thumbnailUrl: string | null;
    fallbackLabel: string;
    permalink: string;
  }[];
}) {
  return (
    <div className="admin-card admin-card-pad">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="admin-section-title">{title}</h2>
        <button type="button" onClick={onRefresh} className="admin-link-accent text-sm">
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((post) => (
            <li key={post.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              {post.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnailUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover bg-white/5"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-muted">
                  {post.fallbackLabel}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  {post.text === "No caption" ? (
                    <span className="text-muted italic">No caption</span>
                  ) : (
                    post.text
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{post.date}</span>
                  {post.meta.map((part) => (
                    <span key={part}>{part}</span>
                  ))}
                </div>
              </div>
              {post.permalink && (
                <Link
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-toolbar-btn shrink-0 self-start"
                  aria-label="Open post"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MetaTokenNote() {
  return (
    <p className="text-xs text-muted">
      Data from Meta Graph API. Page access tokens expire periodically — update{" "}
      <code className="text-white/80">META_PAGE_ACCESS_TOKEN</code> in Hostinger when sync fails.
    </p>
  );
}

export { SocialRangePicker, StatCard, SocialNotConfigured, SocialErrorState, PostsList, MetaTokenNote };
