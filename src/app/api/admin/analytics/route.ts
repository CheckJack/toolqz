import { NextRequest, NextResponse } from "next/server";
import { queryDailyClicks } from "@/lib/analytics-queries";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
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

function getDailyClicksDays(range: string): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  if (range === "all") return 365;
  return 30;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const range = request.nextUrl.searchParams.get("range") ?? "30d";
    const mode = request.nextUrl.searchParams.get("mode") ?? "full";
    const toolSlug = request.nextUrl.searchParams.get("tool");

    if (mode === "dashboard") {
      return NextResponse.json(await getDashboardAnalytics(session));
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const rangeStart = getRangeStart(range);
    const rangeFilter = rangeStart ? { clickedAt: { gte: rangeStart } } : {};
    const dailyDays = getDailyClicksDays(range);

    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);

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
      unassignedCount,
      followUpsDue,
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
        take: 10,
      }),
      prisma.tool.count(),
      prisma.affiliateProgram.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.affiliateProgram.count({ where: { assignedToId: null } }),
      prisma.affiliateProgram.count({
        where: {
          nextFollowUpAt: { lte: weekAhead },
          status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
        },
      }),
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

    const topTools = toolsWithClicks.slice(0, 10);
    const totalForShare = toolsWithClicks.reduce((s, t) => s + t.clicks, 0) || rangeClicks || totalClicks;

    const affiliateClicks = toolsWithClicks
      .filter((t) => t.hasAffiliateUrl)
      .reduce((s, t) => s + t.clicks, 0);

    let toolDailyClicks: { date: string; count: number }[] | undefined;
    if (toolSlug) {
      const tool = await prisma.tool.findUnique({
        where: { slug: toolSlug },
        select: { id: true },
      });
      if (tool) {
        toolDailyClicks = await queryDailyClicks(range, tool.id);
      }
    }

    return NextResponse.json({
      totalClicks,
      todayClicks,
      weekClicks,
      monthClicks,
      rangeClicks,
      range,
      dailyDays: range === "all" ? null : dailyDays,
      topTools,
      allTools: toolsWithClicks,
      dailyClicks,
      toolDailyClicks,
      referrers: referrers.map((r) => ({
        referrer: r.referrer || "(direct)",
        count: r._count.id,
      })),
      affiliateClicks,
      nonAffiliateClicks: totalForShare - affiliateClicks,
      toolCount,
      affiliateCounts: Object.fromEntries(
        affiliateCounts.map((a) => [a.status, a._count.id])
      ),
      unassignedCount,
      followUpsDue,
    });
  } catch (error) {
    console.error("[admin/analytics]", error);
    return handleAuthError(error, "Failed to load analytics");
  }
}
