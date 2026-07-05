export const TOOL_LISTING_TYPES = ["AFFILIATE", "EDITORIAL"] as const;

export type ToolListingType = (typeof TOOL_LISTING_TYPES)[number];

export const TOOL_LISTING_LABELS: Record<ToolListingType, string> = {
  AFFILIATE: "Affiliate partner",
  EDITORIAL: "Editorial pick",
};

export const TOOL_LISTING_DESCRIPTIONS: Record<ToolListingType, string> = {
  AFFILIATE: "We have an affiliate relationship and may earn commission on visits.",
  EDITORIAL: "We recommend this tool — no affiliate partnership or commission.",
};

export function isAffiliateListing(type: string | null | undefined): boolean {
  return type === "AFFILIATE";
}
