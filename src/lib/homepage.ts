import { Category, Website } from "@/types";
import { getCategoryLabel, getDomain } from "@/lib/websites";

export type SortOption = "featured" | "rating" | "name" | "reviewed";

export function getCategoryCounts(
  websites: Website[]
): Record<Category, number> {
  const counts: Record<string, number> = { all: websites.length };
  for (const site of websites) {
    counts[site.category] = (counts[site.category] ?? 0) + 1;
  }
  return counts as Record<Category, number>;
}

export function getPricingHint(website: Website): string | null {
  if (!website.pricing?.length) return null;
  const free = website.pricing.find(
    (p) => p.price.toLowerCase().includes("free") || p.price === "$0"
  );
  if (free) return free.label === "Free" ? "Free tier" : `${free.label}: ${free.price}`;
  return website.pricing[0].price;
}

export function formatReviewed(date?: string): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Lowercase, unify separators, collapse spaces — for fuzzy matching. */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split query into meaningful tokens (supports multi-word and hyphenated terms). */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];

  const tokens = new Set<string>();
  for (const part of normalized.split(" ")) {
    if (part.length >= 1) tokens.add(part);
  }
  return [...tokens];
}

function pricingText(website: Website): string {
  return website.pricing.map((p) => `${p.label} ${p.price} ${p.note ?? ""}`).join(" ");
}

function faqText(website: Website): string {
  return website.faq.map((f) => `${f.question} ${f.answer}`).join(" ");
}

function buildSearchBlob(
  website: Website,
  categoryLabels?: Record<string, string>
): {
  name: string;
  slug: string;
  category: string;
  categoryLabel: string;
  domain: string;
  blob: string;
} {
  const name = normalizeForSearch(website.name);
  const slug = normalizeForSearch(website.slug);
  const category = normalizeForSearch(website.category);
  const categoryLabel = normalizeForSearch(
    categoryLabels?.[website.category] ?? getCategoryLabel(website.category)
  );
  const domain = normalizeForSearch(getDomain(website.url));

  const parts = [
    name,
    slug,
    category,
    categoryLabel,
    domain,
    normalizeForSearch(website.description),
    normalizeForSearch(website.overview),
    normalizeForSearch(website.whoIsItFor),
    normalizeForSearch(website.notForYouIf ?? ""),
    normalizeForSearch(website.highlights.join(" ")),
    normalizeForSearch(website.tags.join(" ")),
    normalizeForSearch(website.pros.join(" ")),
    normalizeForSearch(website.cons.join(" ")),
    normalizeForSearch(pricingText(website)),
    normalizeForSearch(faqText(website)),
  ];

  return {
    name,
    slug,
    category,
    categoryLabel,
    domain,
    blob: parts.join(" "),
  };
}

/** Higher score = better match. Returns 0 when the tool should be hidden. */
export function scoreWebsiteSearch(
  website: Website,
  query: string,
  categoryLabels?: Record<string, string>
): number {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return 1;

  const fields = buildSearchBlob(website, categoryLabels);
  let total = 0;

  for (const token of tokens) {
    let best = 0;

    if (fields.name === token) best = Math.max(best, 120);
    else if (fields.name.startsWith(token)) best = Math.max(best, 100);
    else if (fields.name.includes(token)) best = Math.max(best, 70);

    if (fields.slug === token) best = Math.max(best, 110);
    else if (fields.slug.startsWith(token)) best = Math.max(best, 90);
    else if (fields.slug.includes(token)) best = Math.max(best, 65);

    if (fields.domain.includes(token)) best = Math.max(best, 75);

    if (fields.categoryLabel === token || fields.category === token) {
      best = Math.max(best, 55);
    } else if (fields.categoryLabel.includes(token) || fields.category.includes(token)) {
      best = Math.max(best, 40);
    }

    const tagExact = website.tags.some(
      (tag) => normalizeForSearch(tag) === token
    );
    const tagPartial = website.tags.some((tag) =>
      normalizeForSearch(tag).includes(token)
    );
    if (tagExact) best = Math.max(best, 85);
    else if (tagPartial) best = Math.max(best, 50);

    if (fields.blob.includes(token)) best = Math.max(best, 25);

    if (best === 0) return 0;
    total += best;
  }

  if (website.featured) total += 3;
  if (website.rating) total += Math.min(website.rating, 5);

  return total;
}

export function matchesSearch(
  website: Website,
  query: string,
  categoryLabels?: Record<string, string>
): boolean {
  return scoreWebsiteSearch(website, query, categoryLabels) > 0;
}

export function filterWebsitesBySearch(
  websites: Website[],
  query: string,
  categoryLabels?: Record<string, string>
): Website[] {
  const trimmed = query.trim();
  if (!trimmed) return websites;

  return websites
    .map((site) => ({
      site,
      score: scoreWebsiteSearch(site, trimmed, categoryLabels),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ site }) => site);
}

export function sortWebsites(websites: Website[], sort: SortOption): Website[] {
  const sorted = [...websites];

  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "reviewed":
      return sorted.sort((a, b) => {
        const da = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
        const db = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
        return db - da;
      });
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
  }
}

export function hasActiveBrowseFilters(
  searchQuery: string,
  activeCategory: Category
): boolean {
  return Boolean(searchQuery.trim()) || activeCategory !== "all";
}

export function getActiveCategoryLabel(category: Category): string {
  return category === "all" ? "All categories" : getCategoryLabel(category);
}
