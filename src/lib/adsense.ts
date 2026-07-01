export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export const ADSENSE_SLOTS = {
  blogListBanner:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_BANNER ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT ??
    "",
  blogListSidebar:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_SIDEBAR ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT ??
    "",
  blogArticleTop:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE_TOP ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT ??
    "",
  blogArticleSidebar:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE_SIDEBAR ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT ??
    "",
} as const;

export function isAdSenseEnabled() {
  return Boolean(ADSENSE_CLIENT_ID);
}

export function resolveAdSlot(
  slot: string,
  fallback: keyof typeof ADSENSE_SLOTS
): string {
  return slot || ADSENSE_SLOTS[fallback];
}
