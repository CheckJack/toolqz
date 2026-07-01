import type { Website } from "@/types";

/** Curated brands shown on the partnerships page — order matters for display. */
export const showcasePartnerSlugs = [
  "revolut",
  "notion",
  "canva",
  "figma",
  "todoist",
  "hubspot",
  "hellofresh",
  "duolingo",
] as const;

/** Simple Icons slugs for white brand marks on the partnerships marquee. */
const partnerIconSlugs: Partial<Record<(typeof showcasePartnerSlugs)[number], string>> = {
  revolut: "revolut",
  notion: "notion",
  figma: "figma",
  todoist: "todoist",
  hubspot: "hubspot",
  hellofresh: "hellofresh",
  duolingo: "duolingo",
};

export function getPartnerMarkUrl(partner: Website): string | null {
  const iconSlug = partnerIconSlugs[partner.slug as (typeof showcasePartnerSlugs)[number]];
  if (!iconSlug) return null;
  return `https://cdn.simpleicons.org/${iconSlug}/ffffff`;
}

export function getShowcasePartners(tools: Website[]): Website[] {
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  return showcasePartnerSlugs
    .map((slug) => bySlug.get(slug))
    .filter((t): t is Website => Boolean(t));
}
