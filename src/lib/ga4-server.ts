import { BetaAnalyticsDataClient } from "@google-analytics/data";

export type Ga4Range = "7d" | "30d" | "90d" | "all";

export interface Ga4SiteReport {
  configured: boolean;
  range: Ga4Range;
  users: number;
  sessions: number;
  pageViews: number;
  realtimeActiveUsers: number;
  daily: { date: string; users: number; sessions: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
  topSources: { source: string; sessions: number }[];
}

function getCredentials(): { client_email: string; private_key: string } | null {
  const json = process.env.GA4_CREDENTIALS_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      return null;
    }
  }

  const email = process.env.GA4_CLIENT_EMAIL;
  const key = process.env.GA4_PRIVATE_KEY;
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

function getPropertyId(): string | null {
  const id = process.env.GA4_PROPERTY_ID?.trim();
  return id || null;
}

function getDateRange(range: Ga4Range): { startDate: string; endDate: string } {
  const startMap: Record<Ga4Range, string> = {
    "7d": "7daysAgo",
    "30d": "30daysAgo",
    "90d": "90daysAgo",
    all: "365daysAgo",
  };
  return { startDate: startMap[range], endDate: "today" };
}

function parseMetric(
  row: { metricValues?: { value?: string | null }[] | null } | null | undefined,
  index: number
): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatGaDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

let client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  const credentials = getCredentials();
  if (!credentials) return null;
  if (!client) {
    client = new BetaAnalyticsDataClient({ credentials });
  }
  return client;
}

export function isGa4Configured(): boolean {
  return Boolean(getPropertyId() && getCredentials());
}

export async function fetchGa4SiteReport(range: Ga4Range): Promise<Ga4SiteReport> {
  const propertyId = getPropertyId();
  const gaClient = getClient();

  if (!propertyId || !gaClient) {
    return {
      configured: false,
      range,
      users: 0,
      sessions: 0,
      pageViews: 0,
      realtimeActiveUsers: 0,
      daily: [],
      topPages: [],
      topSources: [],
    };
  }

  const property = `properties/${propertyId}`;
  const dateRanges = [getDateRange(range)];

  const [summaryRes, dailyRes, pagesRes, sourcesRes, realtimeRes] = await Promise.all([
    gaClient.runReport({
      property,
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }),
    gaClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    gaClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }),
    gaClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    gaClient.runRealtimeReport({
      property,
      metrics: [{ name: "activeUsers" }],
    }).catch(() => [{ rows: [] }]),
  ]);

  const summaryRow = summaryRes[0]?.rows?.[0];
  const realtimeRow = realtimeRes[0]?.rows?.[0];

  return {
    configured: true,
    range,
    users: parseMetric(summaryRow, 0),
    sessions: parseMetric(summaryRow, 1),
    pageViews: parseMetric(summaryRow, 2),
    realtimeActiveUsers: parseMetric(realtimeRow, 0),
    daily: (dailyRes[0]?.rows ?? []).map((row) => ({
      date: formatGaDate(row.dimensionValues?.[0]?.value ?? ""),
      users: parseMetric(row, 0),
      sessions: parseMetric(row, 1),
      pageViews: parseMetric(row, 2),
    })),
    topPages: (pagesRes[0]?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "(not set)",
      views: parseMetric(row, 0),
    })),
    topSources: (sourcesRes[0]?.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? "(not set)",
      sessions: parseMetric(row, 0),
    })),
  };
}
