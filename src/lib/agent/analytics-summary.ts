import { queryDailyClicks } from "@/lib/analytics-queries";
import { prisma } from "@/lib/db";

function getRangeStart(range: string): Date | null {
  const now = new Date();
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (range === "90d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }
  return null;
}

export async function getAgentAnalyticsSummary(
  range: string,
  toolSlug?: string
) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(now.getDate() - 30);

  const rangeStart = getRangeStart(range);
  const rangeFilter = rangeStart ? { clickedAt: { gte: rangeStart } } : {};

  const [
    totalClicks,
    todayClicks,
    weekClicks,
    monthClicks,
    rangeClicks,
    dailyClicks,
    allTools,
    referrers,
    toolCount,
    affiliateCounts,
    toolsMissingAffiliate,
    programsNoTool,
  ] = await Promise.all([
    prisma.click.count(),
    prisma.click.count({ where: { clickedAt: { gte: startOfToday } } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfWeek } } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfMonth } } }),
    prisma.click.count({ where: rangeFilter }),
    queryDailyClicks(range),
    prisma.tool.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        affiliateUrl: true,
        published: true,
        _count: { select: { clicks: rangeStart ? { where: rangeFilter } : true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.click.groupBy({
      by: ["referrer"],
      where: rangeFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.tool.count(),
    prisma.affiliateProgram.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.tool.count({ where: { published: true, affiliateUrl: null } }),
    prisma.affiliateProgram.count({ where: { toolId: null } }),
  ]);

  const toolsWithClicks = allTools
    .map((t) => ({
      name: t.name,
      slug: t.slug,
      clicks: t._count.clicks,
      hasAffiliateUrl: !!t.affiliateUrl,
      published: t.published,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const topTools = toolsWithClicks.slice(0, 10);
  const affiliateClicks = toolsWithClicks
    .filter((t) => t.hasAffiliateUrl)
    .reduce((s, t) => s + t.clicks, 0);
  const totalForShare =
    toolsWithClicks.reduce((s, t) => s + t.clicks, 0) || rangeClicks || totalClicks;

  let toolStats: { name: string; slug: string; clicks: number } | undefined;
  if (toolSlug) {
    const match = toolsWithClicks.find((t) => t.slug === toolSlug);
    if (match) {
      toolStats = { name: match.name, slug: match.slug, clicks: match.clicks };
    }
  }

  return {
    range,
    todayClicks,
    weekClicks,
    monthClicks,
    totalClicks,
    rangeClicks,
    toolCount,
    topTools,
    toolStats,
    dailyClicks: dailyClicks.slice(-7),
    topReferrers: referrers.map((r) => ({
      referrer: r.referrer || "(direct)",
      count: r._count.id,
    })),
    affiliateClicks,
    nonAffiliateClicks: totalForShare - affiliateClicks,
    affiliateCounts: Object.fromEntries(
      affiliateCounts.map((a) => [a.status, a._count.id])
    ),
    toolsMissingAffiliate,
    programsNoTool,
    zeroClickTools: toolsWithClicks.filter((t) => t.clicks === 0).length,
  };
}
