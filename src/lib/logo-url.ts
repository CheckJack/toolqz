import { logoFor } from "@/data/tool-helpers";

/** Hosts that often 503/404 when hotlinked — never load in the browser. */
const BLOCKED_LOGO_HOSTS = ["seeklogo.com", "images.seeklogo.com"];

/** Curated local assets for tools we showcase on the homepage. */
const LOCAL_LOGO_BY_SLUG: Record<string, string> = {
  hostinger: "/images/partners/hostinger.png",
  kit: "/images/partners/kit.png",
  metricool: "/images/partners/metricool.png",
  elevenlabs: "/images/partners/elevenlabs.png",
};

function isBlockedLogoHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return BLOCKED_LOGO_HOSTS.some(
    (blocked) => host === blocked || host.endsWith(`.${blocked}`)
  );
}

export function resolveToolLogoUrl(input: {
  logoUrl?: string | null;
  url: string;
  slug?: string;
}): string {
  const slug = input.slug?.toLowerCase();
  const localBySlug = slug ? LOCAL_LOGO_BY_SLUG[slug] : undefined;
  const raw = input.logoUrl?.trim() ?? "";

  if (raw.startsWith("/")) return raw;

  if (raw) {
    try {
      const { hostname } = new URL(raw);
      if (!isBlockedLogoHost(hostname)) return raw;
    } catch {
      return localBySlug ?? logoFor(input.url);
    }
  }

  return localBySlug ?? logoFor(input.url);
}

export function sanitizeLogoUrlForStorage(
  logoUrl: string | null | undefined,
  url: string,
  slug?: string
): string | null {
  const resolved = resolveToolLogoUrl({ logoUrl, url, slug });
  return resolved || null;
}
