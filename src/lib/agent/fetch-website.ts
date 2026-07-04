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

export async function fetchWebsiteContext(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TOOLQZ-Agent/1.0 (+https://toolqz.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Website returned HTTP ${res.status}`);
    }

    const html = await res.text();
    return extractPageContext(html, url);
  } finally {
    clearTimeout(timeout);
  }
}
