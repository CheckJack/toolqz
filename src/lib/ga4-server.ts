import { createPrivateKey } from "node:crypto";
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

export interface Ga4Diagnostics {
  propertyId: boolean;
  credentialSource:
    | "none"
    | "credentials_base64"
    | "credentials_json"
    | "client_email_and_private_key_base64"
    | "client_email_and_private_key";
  clientEmail: string | null;
  privateKeyValid: boolean;
  ready: boolean;
  hint: string | null;
}

export class Ga4ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Ga4ConfigError";
  }
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function decodeBase64Utf8(value: string): string {
  return Buffer.from(value.trim(), "base64").toString("utf8");
}

function sanitizeJsonString(raw: string): string {
  return raw
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

/** Hostinger and other panels often mangle PEM newlines — normalize before use. */
export function normalizePrivateKey(raw: string): string {
  let key = stripWrappingQuotes(raw);
  key = key.replace(/\\n/g, "\n");

  if (!key.includes("-----BEGIN")) {
    const body = key.replace(/\s+/g, "");
    if (body.length > 100) {
      const lines = body.match(/.{1,64}/g) ?? [body];
      key = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
    }
  }

  key = key
    .replace(/-----BEGIN PRIVATE KEY-----\s*/g, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/\s*-----END PRIVATE KEY-----/g, "\n-----END PRIVATE KEY-----\n")
    .replace(/\r\n/g, "\n");

  if (!key.endsWith("\n")) key += "\n";
  return key;
}

function assertValidPrivateKey(key: string): void {
  if (
    !key.includes("-----BEGIN PRIVATE KEY-----") ||
    !key.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Ga4ConfigError(
      "GA4 private key is missing PEM headers. On Hostinger use GA4_CREDENTIALS_BASE64 — run: npm run ga4:env -- path/to/service-account.json"
    );
  }

  try {
    createPrivateKey({ key, format: "pem" });
  } catch {
    throw new Ga4ConfigError(
      "GA4 private key is malformed. On Hostinger use GA4_CREDENTIALS_BASE64 (recommended) — run: npm run ga4:env -- path/to/service-account.json"
    );
  }
}

function parseServiceAccountJson(raw: string): { client_email: string; private_key: string } | null {
  const attempts = [
    raw,
    stripWrappingQuotes(raw),
    sanitizeJsonString(raw),
    sanitizeJsonString(stripWrappingQuotes(raw)),
  ];

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        const private_key = normalizePrivateKey(parsed.private_key);
        assertValidPrivateKey(private_key);
        return { client_email: parsed.client_email, private_key };
      }
    } catch (error) {
      if (error instanceof Ga4ConfigError) throw error;
    }
  }

  return null;
}

type CredentialSource = Exclude<Ga4Diagnostics["credentialSource"], "none">;

function getCredentials(): {
  client_email: string;
  private_key: string;
  source: CredentialSource;
} | null {
  const base64Json = process.env.GA4_CREDENTIALS_BASE64?.trim();
  if (base64Json) {
    try {
      const parsed = parseServiceAccountJson(decodeBase64Utf8(base64Json));
      if (parsed) return { ...parsed, source: "credentials_base64" };
    } catch (error) {
      if (error instanceof Ga4ConfigError) throw error;
    }
    throw new Ga4ConfigError(
      "GA4_CREDENTIALS_BASE64 is set but invalid. Regenerate with: npm run ga4:env -- path/to/service-account.json"
    );
  }

  const json = process.env.GA4_CREDENTIALS_JSON?.trim();
  if (json) {
    const parsed = parseServiceAccountJson(json);
    if (parsed) return { ...parsed, source: "credentials_json" };
    throw new Ga4ConfigError(
      "GA4_CREDENTIALS_JSON is set but could not be parsed. Prefer GA4_CREDENTIALS_BASE64 instead."
    );
  }

  const email = process.env.GA4_CLIENT_EMAIL?.trim();
  const keyBase64 = process.env.GA4_PRIVATE_KEY_BASE64?.trim();
  const keyRaw = process.env.GA4_PRIVATE_KEY;

  if (email && keyBase64) {
    const private_key = normalizePrivateKey(decodeBase64Utf8(keyBase64));
    assertValidPrivateKey(private_key);
    return { client_email: email, private_key, source: "client_email_and_private_key_base64" };
  }

  if (email && keyRaw) {
    const private_key = normalizePrivateKey(keyRaw);
    assertValidPrivateKey(private_key);
    return { client_email: email, private_key, source: "client_email_and_private_key" };
  }

  return null;
}

function getPropertyId(): string | null {
  const id = process.env.GA4_PROPERTY_ID?.trim();
  return id || null;
}

export function getGa4Diagnostics(): Ga4Diagnostics {
  const propertyId = Boolean(getPropertyId());
  let credentialSource: Ga4Diagnostics["credentialSource"] = "none";
  let clientEmail: string | null = null;
  let privateKeyValid = false;
  let hint: string | null = null;

  if (process.env.GA4_CREDENTIALS_BASE64?.trim()) credentialSource = "credentials_base64";
  else if (process.env.GA4_CREDENTIALS_JSON?.trim()) credentialSource = "credentials_json";
  else if (process.env.GA4_CLIENT_EMAIL?.trim() && process.env.GA4_PRIVATE_KEY_BASE64?.trim()) {
    credentialSource = "client_email_and_private_key_base64";
  } else if (process.env.GA4_CLIENT_EMAIL?.trim() && process.env.GA4_PRIVATE_KEY?.trim()) {
    credentialSource = "client_email_and_private_key";
  }

  try {
    const creds = getCredentials();
    if (creds) {
      clientEmail = creds.client_email;
      privateKeyValid = true;
    }
  } catch (error) {
    hint = error instanceof Error ? error.message : "Invalid GA4 credentials";
    if (credentialSource === "client_email_and_private_key") {
      hint +=
        " Remove GA4_PRIVATE_KEY and GA4_CLIENT_EMAIL. Use GA4_CREDENTIALS_BASE64 instead.";
    }
  }

  if (!propertyId) {
    hint = hint ?? "Set GA4_PROPERTY_ID=544145954 in Hostinger environment variables.";
  } else if (credentialSource === "none") {
    hint = hint ?? "Add GA4_CREDENTIALS_BASE64 from: npm run ga4:env -- service-account.json";
  }

  return {
    propertyId,
    credentialSource,
    clientEmail,
    privateKeyValid,
    ready: propertyId && privateKeyValid,
    hint,
  };
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
let clientKey: string | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  const credentials = getCredentials();
  if (!credentials) return null;

  const cacheKey = `${credentials.client_email}:${credentials.private_key.slice(0, 32)}`;
  if (!client || clientKey !== cacheKey) {
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
    clientKey = cacheKey;
  }
  return client;
}

export function isGa4Configured(): boolean {
  return getGa4Diagnostics().ready;
}

export async function fetchGa4SiteReport(range: Ga4Range): Promise<Ga4SiteReport> {
  const diagnostics = getGa4Diagnostics();
  if (!diagnostics.ready) {
    if (diagnostics.hint) throw new Ga4ConfigError(diagnostics.hint);
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
    gaClient
      .runRealtimeReport({
        property,
        metrics: [{ name: "activeUsers" }],
      })
      .catch(() => [{ rows: [] }]),
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
