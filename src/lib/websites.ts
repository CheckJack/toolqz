export function getCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export {
  getPublishedTools,
  getWebsiteBySlug,
  getAllSlugs,
  getRelatedWebsites,
  resolvePublishedToolSlug,
  getCanonicalToolSlug,
} from "@/lib/tools";
