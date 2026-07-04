import { Prisma } from "@prisma/client";

export interface ToolListFilters {
  search?: string | null;
  category?: string | null;
  publishedFilter?: string | null;
  affiliateFilter?: string | null;
  sort?: string | null;
}

export function buildToolWhere(filters: ToolListFilters): Prisma.ToolWhereInput {
  const where: Prisma.ToolWhereInput = {};

  if (filters.search) {
    const q = filters.search;
    where.OR = [
      { name: { contains: q } },
      { slug: { contains: q } },
      { category: { contains: q } },
    ];
  }

  if (filters.category) where.category = filters.category;

  if (filters.publishedFilter === "published") where.published = true;
  if (filters.publishedFilter === "draft") where.published = false;

  if (filters.affiliateFilter === "has") {
    where.affiliateUrl = { not: null };
  }
  if (filters.affiliateFilter === "missing") {
    where.published = true;
    where.affiliateUrl = null;
  }
  if (filters.affiliateFilter === "crm-active-no-url") {
    where.affiliateUrl = null;
    where.affiliate = { is: { status: "ACTIVE" } };
  }

  return where;
}

/** Base filters for publish-status tab counts (search + category only). */
export function buildToolTabCountWhere(
  filters: Pick<ToolListFilters, "search" | "category">
): Prisma.ToolWhereInput {
  return buildToolWhere({
    ...filters,
    publishedFilter: null,
    affiliateFilter: null,
  });
}

export function parseToolFilters(searchParams: URLSearchParams): ToolListFilters {
  return {
    search: searchParams.get("search"),
    category: searchParams.get("category"),
    publishedFilter: searchParams.get("publishedFilter"),
    affiliateFilter: searchParams.get("affiliateFilter"),
    sort: searchParams.get("sort"),
  };
}

export function toolOrderBy(
  sort: string
): Prisma.ToolOrderByWithRelationInput[] {
  switch (sort) {
    case "clicks":
      return [{ clicks: { _count: "desc" } }, { name: "asc" }];
    case "updated":
      return [{ updatedAt: "desc" }];
    default:
      return [{ name: "asc" }];
  }
}
