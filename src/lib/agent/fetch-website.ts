import { assertPublicHttpUrl, assertResolvablePublicHost } from "./url-safety";

function extractMeta(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

export function extractPageContext(html: string, url: string): string {
  const title = extractMeta(html, [/<title[^>]*>([^<]*)<\/title>/i]);
  const description = extractMeta(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ]);
  const ogImage = extractMeta(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ]);
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14_000);

  return [
    `URL: ${url}`,
    title ? `Title: ${title}` : null,
    description ? `Meta description: ${description}` : null,
    ogImage ? `OG image: ${ogImage}` : null,
    "",
    "Page text (truncated):",
    bodyText,
  ]
    .filter(Boolean)
    .join("\n");
}

const EXTRA_PATHS = ["/pricing", "/plans", "/features", "/product"];

function joinOrigin(url: string): string {
  const parsed = assertPublicHttpUrl(url);
  return parsed.origin;
}

async function fetchHtml(url: string): Promise<string | null> {
  const parsed = assertPublicHttpUrl(url);
  await assertResolvablePublicHost(parsed);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "TOOLQZ-Agent/1.0 (+https://toolqz.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWebsiteContext(url: string): Promise<string> {
  const origin = joinOrigin(url);
  const mainHtml = await fetchHtml(url);
  if (!mainHtml) {
    throw new Error(`Website returned an error or could not be fetched: ${url}`);
  }

  const sections: string[] = [extractPageContext(mainHtml, url)];

  for (const path of EXTRA_PATHS) {
    const extraUrl = `${origin}${path}`;
    if (extraUrl === url || extraUrl === `${url}/`) continue;
    const html = await fetchHtml(extraUrl);
    if (html && html.length > 500) {
      sections.push(`\n--- ${path} ---\n${extractPageContext(html, extraUrl)}`);
    }
  }

  return sections.join("\n").slice(0, 28_000);
}
