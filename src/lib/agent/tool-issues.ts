import { prisma } from "@/lib/db";

export async function getToolIssuesSummary() {
  const [publishedNoAffiliate, zeroClickPublished, activeCrmNoUrl, draftCount] =
    await Promise.all([
      prisma.tool.findMany({
        where: { published: true, affiliateUrl: null },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      prisma.tool.findMany({
        where: { published: true, clicks: { none: {} } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      prisma.tool.findMany({
        where: {
          affiliateUrl: null,
          affiliate: { is: { status: "ACTIVE" } },
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      prisma.tool.count({ where: { published: false } }),
    ]);

  const [publishedNoAffiliateTotal, zeroClickTotal, activeCrmNoUrlTotal] =
    await Promise.all([
      prisma.tool.count({ where: { published: true, affiliateUrl: null } }),
      prisma.tool.count({ where: { published: true, clicks: { none: {} } } }),
      prisma.tool.count({
        where: {
          affiliateUrl: null,
          affiliate: { is: { status: "ACTIVE" } },
        },
      }),
    ]);

  return {
    draftCount,
    publishedNoAffiliate: {
      total: publishedNoAffiliateTotal,
      items: publishedNoAffiliate.map((t) => ({
        name: t.name,
        slug: t.slug,
        editUrl: `/admin/tools/${t.id}`,
      })),
    },
    zeroClickPublished: {
      total: zeroClickTotal,
      items: zeroClickPublished.map((t) => ({
        name: t.name,
        slug: t.slug,
        editUrl: `/admin/tools/${t.id}`,
      })),
    },
    activeCrmNoUrl: {
      total: activeCrmNoUrlTotal,
      items: activeCrmNoUrl.map((t) => ({
        name: t.name,
        slug: t.slug,
        editUrl: `/admin/tools/${t.id}`,
      })),
    },
  };
}
