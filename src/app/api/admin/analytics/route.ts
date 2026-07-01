import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
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

async function getToolDailyClicks(toolId: string, range: string) {
  if (range === "all") {
    return prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(clickedAt) as date, COUNT(*) as count
      FROM Click
      WHERE toolId = ${toolId}
      GROUP BY date(clickedAt)
      ORDER BY date ASC
    `;
  }
  if (range === "7d") {
    return prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(clickedAt) as date, COUNT(*) as count
      FROM Click
      WHERE toolId = ${toolId} AND clickedAt >= datetime('now', '-7 days')
      GROUP BY date(clickedAt)
      ORDER BY date ASC
    `;
  }
  if (range === "90d") {
    return prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(clickedAt) as date, COUNT(*) as count
      FROM Click
      WHERE toolId = ${toolId} AND clickedAt >= datetime('now', '-90 days')
      GROUP BY date(clickedAt)
      ORDER BY date ASC
    `;
  }
  return prisma.$queryRaw<{ date: string; count: number }[]>`
    SELECT date(clickedAt) as date, COUNT(*) as count
    FROM Click
    WHERE toolId = ${toolId} AND clickedAt >= datetime('now', '-30 days')
    GROUP BY date(clickedAt)
    ORDER BY date ASC
  `;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const range = request.nextUrl.searchParams.get("range") ?? "30d";
    const mode = request.nextUrl.searchParams.get("mode") ?? "full";
    const toolSlug = request.nextUrl.searchParams.get("tool");

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
      myAssigned,
      myOverdue,
      myInProgress,
      toolsMissingAffiliate,
      programsNoTool,
    ] = await Promise.all([
      prisma.click.count(),
      prisma.click.count({ where: { clickedAt: { gte: startOfToday } } }),
      prisma.click.count({ where: { clickedAt: { gte: startOfWeek } } }),
      prisma.click.count({ where: { clickedAt: { gte: startOfMonth } } }),
      prisma.click.count({ where: rangeFilter }),
      range === "all"
        ? prisma.$queryRaw<{ date: string; count: number }[]>`
            SELECT date(clickedAt) as date, COUNT(*) as count
            FROM Click
            GROUP BY date(clickedAt)
            ORDER BY date ASC
          `
        : range === "7d"
          ? prisma.$queryRaw<{ date: string; count: number }[]>`
              SELECT date(clickedAt) as date, COUNT(*) as count
              FROM Click
              WHERE clickedAt >= datetime('now', '-7 days')
              GROUP BY date(clickedAt)
              ORDER BY date ASC
            `
          : range === "90d"
            ? prisma.$queryRaw<{ date: string; count: number }[]>`
                SELECT date(clickedAt) as date, COUNT(*) as count
                FROM Click
                WHERE clickedAt >= datetime('now', '-90 days')
                GROUP BY date(clickedAt)
                ORDER BY date ASC
              `
            : prisma.$queryRaw<{ date: string; count: number }[]>`
                SELECT date(clickedAt) as date, COUNT(*) as count
                FROM Click
                WHERE clickedAt >= datetime('now', '-30 days')
                GROUP BY date(clickedAt)
                ORDER BY date ASC
              `,
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
      prisma.affiliateProgram.count({ where: { assignedToId: session.id } }),
      prisma.affiliateProgram.count({
        where: {
          assignedToId: session.id,
          nextFollowUpAt: { lt: now },
          status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
        },
      }),
      prisma.affiliateProgram.count({
        where: { assignedToId: session.id, status: "IN_PROGRESS" },
      }),
      prisma.tool.count({ where: { published: true, affiliateUrl: null } }),
      prisma.affiliateProgram.count({ where: { toolId: null } }),
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

    if (mode === "dashboard") {
      return NextResponse.json({
        todayClicks,
        weekClicks,
        monthClicks,
        totalClicks,
        topTools,
        dailyClicks,
        toolCount,
        affiliateCounts: Object.fromEntries(
          affiliateCounts.map((a) => [a.status, a._count.id])
        ),
        unassignedCount,
        followUpsDue,
        myAssigned,
        myOverdue,
        myInProgress,
        toolsMissingAffiliate,
        programsNoTool,
        userName: session.name,
      });
    }

    let toolDailyClicks: { date: string; count: number }[] | undefined;
    if (toolSlug) {
      const tool = await prisma.tool.findUnique({
        where: { slug: toolSlug },
        select: { id: true },
      });
      if (tool) {
        toolDailyClicks = await getToolDailyClicks(tool.id, range);
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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
