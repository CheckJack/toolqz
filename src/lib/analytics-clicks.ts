import { queryDailyClicks } from "@/lib/analytics-queries";
import { clickRangeStartDate, type ClickRange } from "@/lib/analytics-ranges";
import { prisma } from "@/lib/db";

const humanClickFilter = { isBot: false } as const;

export interface OutboundClickAnalytics {
  totalClicks: number;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  rangeClicks: number;
  range: ClickRange;
  botClicksExcluded: number;
  allTools: {
    toolId: string;
    name: string;
    slug: string;
    clicks: number;
    hasAffiliateUrl: boolean;
    published: boolean;
  }[];
  dailyClicks: { date: string; count: number }[];
  toolDailyClicks?: { date: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  utmSources: { source: string; count: number }[];
  sourcePages: { page: string; count: number }[];
  affiliateClicks: number;
  nonAffiliateClicks: number;
  conversionRevenue: number;
  conversionCount: number;
}

export async function fetchOutboundClickAnalytics(
  range: ClickRange,
  toolSlug?: string
): Promise<OutboundClickAnalytics> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(now.getDate() - 30);

  const rangeStart = clickRangeStartDate(range);
  const rangeFilter = rangeStart
    ? { clickedAt: { gte: rangeStart }, ...humanClickFilter }
    : humanClickFilter;
  const botRangeFilter = rangeStart ? { clickedAt: { gte: rangeStart }, isBot: true } : { isBot: true };

  const conversionFilter = rangeStart ? { date: { gte: rangeStart } } : {};

  const [
    totalClicks,
    todayClicks,
    weekClicks,
    monthClicks,
    rangeClicks,
    botClicksExcluded,
    dailyClicks,
    allTools,
    referrers,
    utmSources,
    sourcePages,
    conversions,
    toolForFilter,
  ] = await Promise.all([
    prisma.click.count({ where: humanClickFilter }),
    prisma.click.count({ where: { clickedAt: { gte: startOfToday }, ...humanClickFilter } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfWeek }, ...humanClickFilter } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfMonth }, ...humanClickFilter } }),
    prisma.click.count({ where: rangeFilter }),
    prisma.click.count({ where: botRangeFilter }),
    queryDailyClicks(range),
    prisma.tool.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        affiliateUrl: true,
        published: true,
        _count: { select: { clicks: rangeStart ? { where: rangeFilter } : { where: humanClickFilter } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.click.groupBy({
      by: ["referrer"],
      where: rangeFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.click.groupBy({
      by: ["utmSource"],
      where: { ...rangeFilter, utmSource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.click.groupBy({
      by: ["sourcePage"],
      where: { ...rangeFilter, sourcePage: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.affiliateConversion
      .aggregate({
        where: conversionFilter,
        _sum: { amount: true },
        _count: { id: true },
      })
      .catch(() => ({ _sum: { amount: null }, _count: { id: 0 } })),
    toolSlug
      ? prisma.tool.findUnique({ where: { slug: toolSlug }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  const toolsWithClicks = allTools
    .map((t) => ({
      toolId: t.id,
      name: t.name,
      slug: t.slug,
      clicks: t._count.clicks,
      hasAffiliateUrl: !!t.affiliateUrl,
      published: t.published,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const totalForShare =
    toolsWithClicks.reduce((s, t) => s + t.clicks, 0) || rangeClicks || totalClicks;

  const affiliateClicks = toolsWithClicks
    .filter((t) => t.hasAffiliateUrl)
    .reduce((s, t) => s + t.clicks, 0);

  let toolDailyClicks: { date: string; count: number }[] | undefined;
  if (toolForFilter) {
    toolDailyClicks = await queryDailyClicks(range, toolForFilter.id);
  }

  return {
    totalClicks,
    todayClicks,
    weekClicks,
    monthClicks,
    rangeClicks,
    range,
    botClicksExcluded,
    allTools: toolsWithClicks,
    dailyClicks,
    toolDailyClicks,
    referrers: referrers.map((r) => ({
      referrer: r.referrer || "(direct)",
      count: r._count.id,
    })),
    utmSources: utmSources.map((r) => ({
      source: r.utmSource || "(unknown)",
      count: r._count.id,
    })),
    sourcePages: sourcePages.map((r) => ({
      page: r.sourcePage || "(unknown)",
      count: r._count.id,
    })),
    affiliateClicks,
    nonAffiliateClicks: totalForShare - affiliateClicks,
    conversionRevenue: conversions._sum.amount ?? 0,
    conversionCount: conversions._count.id,
  };
}
