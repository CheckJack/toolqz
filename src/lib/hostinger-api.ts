const BASE = "https://developers.hostinger.com";

export class HostingerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HostingerConfigError";
  }
}

export interface HostingerWebsite {
  username: string;
  domain: string;
  enabled: boolean;
}

export interface HostingerBuild {
  uuid: string;
  status: string;
  createdAt: string;
}

function getToken(): string | null {
  return process.env.HOSTINGER_API_TOKEN?.trim() || null;
}

export function getHostingerDomain(): string {
  return process.env.HOSTINGER_DOMAIN?.trim() || "toolqz.com";
}

export function isHostingerConfigured(): boolean {
  return Boolean(getToken());
}

function unwrapList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const obj = data as { data?: unknown; items?: unknown };
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  }
  return [];
}

async function hostingerFetch(path: string): Promise<unknown> {
  const token = getToken();
  if (!token) {
    throw new HostingerConfigError(
      "HOSTINGER_API_TOKEN is not set. Add it to server environment variables."
    );
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : `Hostinger API error (${res.status})`;
    throw new Error(msg);
  }

  return body;
}

export async function findWebsite(domain = getHostingerDomain()): Promise<HostingerWebsite> {
  const data = await hostingerFetch("/api/hosting/v1/websites");
  const sites = unwrapList(data);
  const match = sites.find((s) => {
    const siteDomain = String(s.domain ?? s.name ?? "").toLowerCase();
    return (
      siteDomain === domain.toLowerCase() || siteDomain.endsWith(domain.toLowerCase())
    );
  });

  if (!match) {
    throw new Error(`Website not found for domain "${domain}".`);
  }

  const username = String(match.username ?? match.account ?? "");
  const siteDomain = String(match.domain ?? match.name ?? "");
  if (!username || !siteDomain) {
    throw new Error("Website record missing username or domain.");
  }

  return {
    username,
    domain: siteDomain,
    enabled: match.is_enabled !== false && match.enabled !== false,
  };
}

export async function listBuilds(domain = getHostingerDomain(), limit = 20): Promise<HostingerBuild[]> {
  const { username, domain: siteDomain } = await findWebsite(domain);
  const data = await hostingerFetch(
    `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(siteDomain)}/nodejs/builds`
  );

  return unwrapList(data)
    .map((build) => ({
      uuid: String(build.uuid ?? build.id ?? ""),
      status: String(build.status ?? build.state ?? "unknown"),
      createdAt: String(build.created_at ?? build.createdAt ?? ""),
    }))
    .filter((b) => b.uuid)
    .slice(0, limit);
}

export async function getBuildLogs(
  uuid: string,
  domain = getHostingerDomain()
): Promise<string> {
  const { username, domain: siteDomain } = await findWebsite(domain);
  const data = await hostingerFetch(
    `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(siteDomain)}/nodejs/builds/${encodeURIComponent(uuid)}/logs`
  );

  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as { logs?: unknown; data?: unknown };
    if (typeof obj.logs === "string") return obj.logs;
    if (typeof obj.data === "string") return obj.data;
    return JSON.stringify(data, null, 2);
  }
  return String(data ?? "");
}

export async function pingPublicSite(url?: string): Promise<{ ok: boolean; status: number }> {
  const target = (url ?? process.env.NEXT_PUBLIC_APP_URL ?? `https://${getHostingerDomain()}`).replace(
    /\/$/,
    ""
  );

  try {
    const res = await fetch(target, { method: "GET", next: { revalidate: 0 } });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
