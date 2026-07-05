/** Published affiliate partners that should have a tracking URL. */
export const partnerMissingAffiliateWhere = {
  published: true,
  listingType: "AFFILIATE",
  affiliateUrl: null,
} as const;

export function maskSubscriberEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••";
  const visible = local.length <= 2 ? local[0] : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}
