import type { Tool } from "@prisma/client";
import type {
  FaqItem,
  HowItWorksStep,
  PricingTier,
} from "@/types";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toJson(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? []);
}

export function buildToolData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  const scalars = [
    "slug",
    "name",
    "description",
    "overview",
    "url",
    "affiliateUrl",
    "category",
    "featured",
    "rating",
    "published",
    "logoUrl",
    "whoIsItFor",
    "notForYouIf",
    "lastReviewed",
  ] as const;

  for (const key of scalars) {
    if (body[key] !== undefined) {
      data[key] =
        key === "affiliateUrl" || key === "notForYouIf" || key === "logoUrl" || key === "lastReviewed"
          ? body[key] || null
          : key === "rating"
            ? body[key] === "" || body[key] === null
              ? null
              : Number(body[key])
            : body[key];
    }
  }

  const jsonFields = [
    "highlights",
    "tags",
    "screenshots",
    "howItWorks",
    "pricing",
    "pros",
    "cons",
    "faq",
  ] as const;

  for (const key of jsonFields) {
    if (body[key] !== undefined) {
      data[key] = toJson(body[key]);
    }
  }

  return data;
}

export interface AdminTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview: string;
  highlights: string[];
  url: string;
  affiliateUrl: string | null;
  category: string;
  tags: string[];
  featured: boolean;
  rating: number | null;
  published: boolean;
  logoUrl: string | null;
  screenshots: string[];
  whoIsItFor: string;
  notForYouIf: string | null;
  howItWorks: HowItWorksStep[];
  pricing: PricingTier[];
  pros: string[];
  cons: string[];
  faq: FaqItem[];
  lastReviewed: string | null;
  createdAt: string;
  updatedAt: string;
  affiliate?: {
    id: string;
    status: string;
    companyName: string;
  } | null;
  _count?: { clicks: number };
}

export function serializeTool(tool: Tool & { _count?: { clicks: number }; affiliate?: { id: string; status: string; companyName: string } | null }): AdminTool {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    overview: tool.overview,
    highlights: parseJson(tool.highlights, []),
    url: tool.url,
    affiliateUrl: tool.affiliateUrl,
    category: tool.category,
    tags: parseJson(tool.tags, []),
    featured: tool.featured,
    rating: tool.rating,
    published: tool.published,
    logoUrl: tool.logoUrl,
    screenshots: parseJson(tool.screenshots, []),
    whoIsItFor: tool.whoIsItFor,
    notForYouIf: tool.notForYouIf,
    howItWorks: parseJson(tool.howItWorks, []),
    pricing: parseJson(tool.pricing, []),
    pros: parseJson(tool.pros, []),
    cons: parseJson(tool.cons, []),
    faq: parseJson(tool.faq, []),
    lastReviewed: tool.lastReviewed,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
    affiliate: tool.affiliate ?? undefined,
    _count: tool._count,
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function mapAffiliateCategoryToTool(category?: string | null): string {
  if (!category) return "digital";
  const c = category.toLowerCase();
  if (c.includes("email") || c.includes("marketing") || c.includes("seo") || c.includes("lead")) return "marketing";
  if (c.includes("course") || c.includes("learning") || c.includes("education")) return "education";
  if (c.includes("ecommerce") || c.includes("e-commerce") || c.includes("shop")) return "shopping";
  if (c.includes("productivity") || c.includes("crm")) return "productivity";
  if (c.includes("finance") || c.includes("vpn")) return "finance";
  if (c.includes("health") || c.includes("fitness")) return "health";
  if (c.includes("entertainment") || c.includes("streaming")) return "entertainment";
  if (c.includes("food")) return "food";
  if (c.includes("gambling")) return "gambling";
  return "digital";
}
