"use client";

import { applyAnalyticsUrlParams, type AnalyticsTab } from "@/lib/analytics-ranges";

/** Update analytics URL without triggering a Next.js RSC navigation. */
export function replaceAnalyticsUrl(
  tab: AnalyticsTab,
  range?: string,
  extra?: Record<string, string | null | undefined>
) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  applyAnalyticsUrlParams(params, tab, range ?? params.get("range") ?? undefined);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
  }

  const qs = params.toString();
  const path = qs ? `/admin/analytics?${qs}` : "/admin/analytics";
  window.history.replaceState(null, "", path);
}

export function readAnalyticsTab(): AnalyticsTab {
  if (typeof window === "undefined") return "overview";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "traffic") return "traffic";
  if (tab === "clicks") return "clicks";
  if (tab === "instagram") return "instagram";
  if (tab === "facebook") return "facebook";
  return "overview";
}
