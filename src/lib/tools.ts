import {
  buildTrackedRedirectUrl,
  CLICK_DEDUP_WINDOW_MS,
  parseClickContext,
  type ClickTrackingInput,
} from "@/lib/click-tracking";
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
    listingType: (tool.listingType === "AFFILIATE" ? "AFFILIATE" : "EDITORIAL") as import("@/constants/tool-listing").ToolListingType,
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

function resolveListingType(tool: Tool): "AFFILIATE" | "EDITORIAL" {
  return tool.listingType === "AFFILIATE" ? "AFFILIATE" : "EDITORIAL";
}

export async function getToolRedirectUrl(slug: string): Promise<string | null> {
  const resolved = await resolvePublishedToolSlug(slug);
  if (!resolved) return null;
  const { tool } = resolved;
  if (tool.listingType === "AFFILIATE" && tool.affiliateUrl?.trim()) {
    return tool.affiliateUrl.trim();
  }
  return tool.url;
}

export type RecordClickResult =
  | { recorded: false; reason: "unknown_tool" | "duplicate" | "bot" }
  | { recorded: true; clickId: string; redirectUrl: string };

export async function recordClick(input: ClickTrackingInput): Promise<RecordClickResult> {
  const resolved = await resolvePublishedToolSlug(input.slug);
  if (!resolved) return { recorded: false, reason: "unknown_tool" };

  const { tool } = resolved;
  const context = parseClickContext(input);

  if (context.isBot) {
    return { recorded: false, reason: "bot" };
  }

  if (context.ipHash) {
    const dedupeSince = new Date(Date.now() - CLICK_DEDUP_WINDOW_MS);
    const recent = await prisma.click.findFirst({
      where: {
        toolId: tool.id,
        ipHash: context.ipHash,
        isBot: false,
        clickedAt: { gte: dedupeSince },
      },
      select: { id: true },
    });
    if (recent) {
      return { recorded: false, reason: "duplicate" };
    }
  }

  const affiliateProgram = await prisma.affiliateProgram.findUnique({
    where: { toolId: tool.id },
    select: { id: true },
  });

  const listingType = resolveListingType(tool);
  const destination =
    listingType === "AFFILIATE" && tool.affiliateUrl?.trim()
      ? tool.affiliateUrl.trim()
      : tool.url;

  const click = await prisma.click.create({
    data: {
      toolId: tool.id,
      referrer: input.referrer ?? null,
      userAgent: input.userAgent ?? null,
      utmSource: context.utmSource,
      utmMedium: context.utmMedium,
      utmCampaign: context.utmCampaign,
      utmContent: context.utmContent,
      utmTerm: context.utmTerm,
      sourcePage: context.sourcePage,
      listingType,
      affiliateProgramId: affiliateProgram?.id ?? null,
      isBot: false,
      ipHash: context.ipHash,
    },
  });

  return {
    recorded: true,
    clickId: click.id,
    redirectUrl: buildTrackedRedirectUrl(destination, click.id, tool.slug, listingType),
  };
}
