import { prisma } from "@/lib/db";
import { resolveToolLogoUrl } from "@/lib/logo-url";
import { Website } from "@/types";
import type { Tool } from "@prisma/client";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function mapToolToWebsite(tool: Tool): Website {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    overview: tool.overview,
    highlights: parseJson(tool.highlights, []),
    url: tool.url,
    category: tool.category as Website["category"],
    tags: parseJson(tool.tags, []),
    featured: tool.featured,
    rating: tool.rating ?? undefined,
    logoUrl: resolveToolLogoUrl({
      logoUrl: tool.logoUrl,
      url: tool.url,
      slug: tool.slug,
    }),
    screenshots: parseJson(tool.screenshots, []),
    whoIsItFor: tool.whoIsItFor,
    notForYouIf: tool.notForYouIf ?? undefined,
    howItWorks: parseJson(tool.howItWorks, []),
    pricing: parseJson(tool.pricing, []),
    pros: parseJson(tool.pros, []),
    cons: parseJson(tool.cons, []),
    faq: parseJson(tool.faq, []),
    lastReviewed: tool.lastReviewed ?? undefined,
  };
}

export async function getPublishedTools(): Promise<Website[]> {
  const tools = await prisma.tool.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
  return tools.map(mapToolToWebsite);
}

export async function resolvePublishedToolSlug(
  slug: string
): Promise<{ tool: Tool; canonicalSlug: string; redirectedFrom?: string } | null> {
  const direct = await prisma.tool.findFirst({
    where: { slug, published: true },
  });
  if (direct) {
    return { tool: direct, canonicalSlug: direct.slug };
  }

  const redirect = await prisma.toolSlugRedirect.findUnique({
    where: { oldSlug: slug },
    include: { tool: true },
  });
  if (redirect?.tool?.published) {
    return {
      tool: redirect.tool,
      canonicalSlug: redirect.tool.slug,
      redirectedFrom: slug,
    };
  }

  return null;
}

export async function getWebsiteBySlug(slug: string): Promise<Website | null> {
  const resolved = await resolvePublishedToolSlug(slug);
  return resolved ? mapToolToWebsite(resolved.tool) : null;
}

export async function getCanonicalToolSlug(slug: string): Promise<string | null> {
  const resolved = await resolvePublishedToolSlug(slug);
  return resolved?.canonicalSlug ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const [tools, redirects] = await Promise.all([
    prisma.tool.findMany({
      where: { published: true },
      select: { slug: true },
    }),
    prisma.toolSlugRedirect.findMany({
      where: { tool: { published: true } },
      select: { oldSlug: true },
    }),
  ]);
  return [...tools.map((t) => t.slug), ...redirects.map((r) => r.oldSlug)];
}

export async function getRelatedWebsites(
  website: Website,
  limit = 3
): Promise<Website[]> {
  const tools = await prisma.tool.findMany({
    where: {
      published: true,
      category: website.category,
      NOT: { id: website.id },
    },
    take: limit,
    orderBy: { name: "asc" },
  });
  return tools.map(mapToolToWebsite);
}

export async function getToolRedirectUrl(slug: string): Promise<string | null> {
  const resolved = await resolvePublishedToolSlug(slug);
  if (!resolved) return null;
  return resolved.tool.affiliateUrl || resolved.tool.url;
}

export async function recordClick(
  slug: string,
  meta: { referrer?: string | null; userAgent?: string | null }
) {
  const resolved = await resolvePublishedToolSlug(slug);
  if (!resolved) return false;

  await prisma.click.create({
    data: {
      toolId: resolved.tool.id,
      referrer: meta.referrer ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
  return true;
}
