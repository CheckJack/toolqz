const GRAPH_API_VERSION = "v25.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type SocialRange = "7d" | "30d" | "90d";

export class MetaGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaGraphError";
  }
}

export function getMetaPageAccessToken(): string | null {
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  return token || null;
}

export function socialRangeToSinceUntil(range: SocialRange): { since: number; until: number } {
  const until = Math.floor(Date.now() / 1000);
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = until - days * 24 * 60 * 60;
  return { since, until };
}

export function formatInsightDate(endTime: string): string {
  const d = new Date(endTime);
  if (Number.isNaN(d.getTime())) return endTime;
  return d.toISOString().slice(0, 10);
}

interface GraphErrorBody {
  error?: { message?: string; code?: number };
}

export async function metaGraphGet<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const token = getMetaPageAccessToken();
  if (!token) throw new MetaGraphError("META_PAGE_ACCESS_TOKEN is not set.");

  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const body = (await res.json()) as T & GraphErrorBody;

  if (!res.ok || body.error) {
    const msg = body.error?.message ?? `Meta Graph API request failed (${res.status})`;
    throw new MetaGraphError(msg);
  }

  return body;
}

export function parseSocialRange(raw: string | undefined): SocialRange {
  if (raw === "7d" || raw === "90d") return raw;
  return "30d";
}
