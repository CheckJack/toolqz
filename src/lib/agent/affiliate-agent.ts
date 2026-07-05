import { logAffiliateActivity } from "@/lib/affiliate-db";
import { prisma } from "@/lib/db";
import { assertUniqueMatch } from "./entity-resolve";

const affiliateSelect = {
  id: true,
  companyName: true,
  status: true,
  toolId: true,
  website: true,
  affiliateUrl: true,
  portalUrl: true,
  signupUrl: true,
  nextFollowUpAt: true,
  assignedToId: true,
} as const;

export async function findAffiliateForAgent(args: Record<string, unknown>) {
  const id = typeof args.affiliate_id === "string" ? args.affiliate_id.trim() : "";
  const companyName =
    typeof args.company_name === "string" ? args.company_name.trim() : "";

  if (id) {
    return prisma.affiliateProgram.findUnique({ where: { id }, select: affiliateSelect });
  }
  if (companyName) {
    const rows = await prisma.affiliateProgram.findMany({
      where: { companyName: { contains: companyName } },
      select: affiliateSelect,
      orderBy: { companyName: "asc" },
      take: 6,
    });
    return assertUniqueMatch(rows, companyName, (r) => r.companyName, "affiliate program");
  }
  return null;
}

const AFFILIATE_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "ACTIVE",
  "APPLIED",
  "REJECTED",
  "NOT_AVAILABLE",
]);

export async function createAffiliateForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const companyName =
    typeof args.company_name === "string" ? args.company_name.trim() : "";
  if (!companyName) throw new Error("create_affiliate requires company_name");

  const lower = companyName.toLowerCase();
  const existing = await prisma.affiliateProgram.findFirst({
    where: { companyName },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A program named "${companyName}" already exists`);
  }
  const allNames = await prisma.affiliateProgram.findMany({ select: { companyName: true } });
  if (allNames.some((a) => a.companyName.trim().toLowerCase() === lower)) {
    throw new Error(`A program named "${companyName}" already exists`);
  }

  const statusRaw = typeof args.status === "string" ? args.status.trim().toUpperCase() : "PENDING";
  const status = AFFILIATE_STATUSES.has(statusRaw) ? statusRaw : "PENDING";

  const website = typeof args.website === "string" ? args.website.trim() || null : null;
  const signupUrl =
    typeof args.signup_url === "string" ? args.signup_url.trim() || null : null;
  const portalUrl =
    typeof args.portal_url === "string" ? args.portal_url.trim() || null : null;
  const affiliateUrl =
    typeof args.affiliate_url === "string" ? args.affiliate_url.trim() || null : null;
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;

  let nextFollowUpAt: Date | null = null;
  if (typeof args.next_follow_up === "string" && args.next_follow_up.trim()) {
    const d = new Date(args.next_follow_up.trim());
    if (Number.isNaN(d.getTime())) throw new Error("Invalid next_follow_up — use YYYY-MM-DD");
    nextFollowUpAt = d;
  }

  const assignedToId = args.assigned_to_me === true ? userId : null;

  const affiliate = await prisma.affiliateProgram.create({
    data: {
      companyName,
      website,
      signupUrl,
      portalUrl,
      affiliateUrl,
      status,
      notes,
      nextFollowUpAt,
      assignedToId,
      source: "assistant",
    },
    select: affiliateSelect,
  });

  await logAffiliateActivity(affiliate.id, "note", "Program created via assistant", userId);

  return {
    id: affiliate.id,
    companyName: affiliate.companyName,
    status: affiliate.status,
    editUrl: `/admin/affiliates/${affiliate.id}`,
  };
}
