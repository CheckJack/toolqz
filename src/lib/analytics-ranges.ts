export type TrafficRange = "7d" | "30d" | "90d" | "all";
export type SocialRange = "7d" | "30d" | "90d";
export type ClickRange = "7d" | "30d" | "90d" | "all";
export type AnalyticsTab = "overview" | "traffic" | "instagram" | "facebook" | "clicks";

const TRAFFIC_RANGES = new Set<TrafficRange>(["7d", "30d", "90d", "all"]);
const SOCIAL_RANGES = new Set<SocialRange>(["7d", "30d", "90d"]);
const CLICK_RANGES = new Set<ClickRange>(["7d", "30d", "90d", "all"]);

export function parseTrafficRange(raw: string | undefined | null): TrafficRange {
  if (raw && TRAFFIC_RANGES.has(raw as TrafficRange)) return raw as TrafficRange;
  return "30d";
}

export function parseSocialRange(raw: string | undefined | null): SocialRange {
  if (raw && SOCIAL_RANGES.has(raw as SocialRange)) return raw as SocialRange;
  if (raw === "all") return "90d";
  return "30d";
}

export function parseClickRange(raw: string | undefined | null): ClickRange {
  if (raw && CLICK_RANGES.has(raw as ClickRange)) return raw as ClickRange;
  return "30d";
}

export function parseRangeForTab(
  tab: AnalyticsTab,
  raw: string | undefined | null
): TrafficRange | SocialRange | ClickRange {
  switch (tab) {
    case "traffic":
      return parseTrafficRange(raw);
    case "instagram":
    case "facebook":
    case "overview":
      return parseSocialRange(raw);
    case "clicks":
      return parseClickRange(raw);
  }
}

export function normalizeRangeForTab(
  tab: AnalyticsTab,
  raw: string | undefined | null
): string {
  return parseRangeForTab(tab, raw);
}

export function defaultRangeForTab(tab: AnalyticsTab): string {
  return "30d";
}

export function isDefaultRange(tab: AnalyticsTab, range: string): boolean {
  return range === defaultRangeForTab(tab);
}

/** Apply tab + range to URL search params (mutates params). */
export function applyAnalyticsUrlParams(
  params: URLSearchParams,
  tab: AnalyticsTab,
  range?: string
) {
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);

  const normalized = normalizeRangeForTab(tab, range ?? params.get("range"));
  if (isDefaultRange(tab, normalized)) params.delete("range");
  else params.set("range", normalized);
}

export function socialRangeStartDate(range: SocialRange): Date {
  const d = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function clickRangeStartDate(range: ClickRange): Date | null {
  const d = new Date();
  if (range === "all") return null;
  if (range === "7d") d.setDate(d.getDate() - 7);
  else if (range === "90d") d.setDate(d.getDate() - 90);
  else d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}
