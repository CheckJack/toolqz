import { createHash } from "crypto";

export type UtmParams = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export type ClickTrackingInput = {
  slug: string;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  requestUrl: string;
};

export type ParsedClickContext = UtmParams & {
  sourcePage: string | null;
  isBot: boolean;
  ipHash: string | null;
};

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|go-http-client|java\/|scrapy|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic-ai/i;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function isLikelyBot(userAgent?: string | null): boolean {
  if (!userAgent?.trim()) return false;
  return BOT_UA_PATTERN.test(userAgent);
}

export function hashIp(ip?: string | null): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(`toolqz-click:${ip}`).digest("hex").slice(0, 16);
}

export function parseUtmFromUrl(url: string): UtmParams {
  try {
    const parsed = new URL(url);
    return {
      utmSource: parsed.searchParams.get("utm_source"),
      utmMedium: parsed.searchParams.get("utm_medium"),
      utmCampaign: parsed.searchParams.get("utm_campaign"),
      utmContent: parsed.searchParams.get("utm_content"),
      utmTerm: parsed.searchParams.get("utm_term"),
    };
  } catch {
    return {};
  }
}

export function extractSourcePage(referrer?: string | null): string | null {
  if (!referrer?.trim()) return null;
  try {
    const parsed = new URL(referrer);
    if (!parsed.hostname.endsWith("toolqz.com")) return null;
    return parsed.pathname;
  } catch {
    return null;
  }
}

export function parseClickContext(input: ClickTrackingInput): ParsedClickContext {
  const requestUtms = parseUtmFromUrl(input.requestUrl);
  const referrerUtms = input.referrer ? parseUtmFromUrl(input.referrer) : {};

  return {
    utmSource: requestUtms.utmSource ?? referrerUtms.utmSource ?? null,
    utmMedium: requestUtms.utmMedium ?? referrerUtms.utmMedium ?? null,
    utmCampaign: requestUtms.utmCampaign ?? referrerUtms.utmCampaign ?? null,
    utmContent: requestUtms.utmContent ?? referrerUtms.utmContent ?? null,
    utmTerm: requestUtms.utmTerm ?? referrerUtms.utmTerm ?? null,
    sourcePage: extractSourcePage(input.referrer),
    isBot: isLikelyBot(input.userAgent),
    ipHash: hashIp(input.ip),
  };
}

/** Append Toolqz attribution params without clobbering existing query keys. */
export function buildTrackedRedirectUrl(
  destination: string,
  clickId: string,
  toolSlug: string,
  listingType: "AFFILIATE" | "EDITORIAL"
): string {
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    return destination;
  }

  if (!url.searchParams.has("tqz_click")) {
    url.searchParams.set("tqz_click", clickId);
  }

  if (listingType === "AFFILIATE") {
    if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", "toolqz");
    if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "affiliate");
    if (!url.searchParams.has("utm_campaign")) url.searchParams.set("utm_campaign", toolSlug);
  }

  return url.toString();
}

export function mergeUtmParams(...sources: UtmParams[]): UtmParams {
  const merged: UtmParams = {};
  for (const source of sources) {
    if (!merged.utmSource && source.utmSource) merged.utmSource = source.utmSource;
    if (!merged.utmMedium && source.utmMedium) merged.utmMedium = source.utmMedium;
    if (!merged.utmCampaign && source.utmCampaign) merged.utmCampaign = source.utmCampaign;
    if (!merged.utmContent && source.utmContent) merged.utmContent = source.utmContent;
    if (!merged.utmTerm && source.utmTerm) merged.utmTerm = source.utmTerm;
  }
  return merged;
}

export const CLICK_DEDUP_WINDOW_MS = 10_000;

export { UTM_KEYS };
