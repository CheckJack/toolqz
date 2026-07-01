import { Prisma } from "@prisma/client";

export interface AffiliateListFilters {
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  assignedToId?: string | null;
  search?: string | null;
  unassigned?: boolean;
  hasTool?: string | null;
  followups?: string | null;
  mine?: boolean;
  sessionUserId: string;
}

export function buildAffiliateWhere(
  filters: AffiliateListFilters
): Prisma.AffiliateProgramWhereInput {
  const where: Prisma.AffiliateProgramWhereInput = {};

  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.unassigned) where.assignedToId = null;
  if (filters.hasTool === "true") where.toolId = { not: null };
  if (filters.hasTool === "false") where.toolId = null;
  if (filters.search) where.companyName = { contains: filters.search };

  if (filters.mine) {
    where.assignedToId = filters.sessionUserId;
  }

  if (filters.followups === "due") {
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);
    where.nextFollowUpAt = { lte: weekAhead };
    where.status = { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] };
  }

  return where;
}

export function parseAffiliateFilters(
  searchParams: URLSearchParams,
  sessionUserId: string
): AffiliateListFilters {
  return {
    status: searchParams.get("status"),
    priority: searchParams.get("priority"),
    category: searchParams.get("category"),
    assignedToId: searchParams.get("assignedToId"),
    search: searchParams.get("search"),
    unassigned: searchParams.get("unassigned") === "true",
    hasTool: searchParams.get("hasTool"),
    followups: searchParams.get("followups"),
    mine: searchParams.get("mine") === "true",
    sessionUserId,
  };
}

export function affiliateOrderBy(
  sort: string
): Prisma.AffiliateProgramOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ companyName: "asc" }];
    case "followup":
      return [{ nextFollowUpAt: "asc" }, { companyName: "asc" }];
    case "priority":
      return [{ priority: "desc" }, { updatedAt: "desc" }];
    default:
      return [{ updatedAt: "desc" }];
  }
}
