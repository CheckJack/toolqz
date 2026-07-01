import { Category, Website } from "@/types";
import { getCategoryLabel } from "@/lib/websites";

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

export function matchesSearch(website: Website, query: string): boolean {
  const q = query.toLowerCase();
  const pricingText = website.pricing.map((p) => `${p.label} ${p.price}`).join(" ");

  return (
    website.name.toLowerCase().includes(q) ||
    website.description.toLowerCase().includes(q) ||
    website.overview.toLowerCase().includes(q) ||
    website.whoIsItFor.toLowerCase().includes(q) ||
    website.category.toLowerCase().includes(q) ||
    pricingText.toLowerCase().includes(q) ||
    website.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    website.pros.some((p) => p.toLowerCase().includes(q))
  );
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
