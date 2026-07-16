import { queryDailyClicks } from "@/lib/analytics-queries";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface DashboardData {
  totalClicks: number;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  topTools: { toolId: string; name: string; slug: string; clicks: number }[];
  dailyClicks: { date: string; count: number }[];
  toolCount: number;
  affiliateCounts: Record<string, number>;
  unassignedCount: number;
  followUpsDue: number;
  myAssigned: number;
  myOverdue: number;
  myInProgress: number;
  toolsMissingAffiliate: number;
  programsNoTool: number;
  userName: string;
}

const INACTIVE_STATUSES = ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] as const;
const humanClickFilter = { isBot: false } as const;

/** Dashboard metrics with batched queries to avoid exhausting the DB pool. */
export async function getDashboardAnalytics(session: SessionUser): Promise<DashboardData> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now);
  startOfMonth.setDate(now.getDate() - 30);
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);

  const [totalClicks, todayClicks, weekClicks, monthClicks, dailyClicks] = await Promise.all([
    prisma.click.count({ where: humanClickFilter }),
    prisma.click.count({ where: { clickedAt: { gte: startOfToday }, ...humanClickFilter } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfWeek }, ...humanClickFilter } }),
    prisma.click.count({ where: { clickedAt: { gte: startOfMonth }, ...humanClickFilter } }),
    queryDailyClicks("7d"),
  ]);

  const [
    toolCount,
    affiliateCounts,
    unassignedCount,
    followUpsDue,
    toolsMissingAffiliate,
    programsNoTool,
  ] = await Promise.all([
    prisma.tool.count(),
    prisma.affiliateProgram.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.affiliateProgram.count({ where: { assignedToId: null } }),
    prisma.affiliateProgram.count({
      where: {
        nextFollowUpAt: { lte: weekAhead },
        status: { notIn: [...INACTIVE_STATUSES] },
      },
    }),
    prisma.tool.count({ where: { published: true, affiliateUrl: null } }),
    prisma.affiliateProgram.count({ where: { toolId: null } }),
  ]);

  const [myAssigned, myOverdue, myInProgress] = await Promise.all([
    prisma.affiliateProgram.count({ where: { assignedToId: session.id } }),
    prisma.affiliateProgram.count({
      where: {
        assignedToId: session.id,
        nextFollowUpAt: { lt: now },
        status: { notIn: [...INACTIVE_STATUSES] },
      },
    }),
    prisma.affiliateProgram.count({
      where: { assignedToId: session.id, status: "IN_PROGRESS" },
    }),
  ]);

  const clickCounts = await prisma.click.groupBy({
    by: ["toolId"],
    where: humanClickFilter,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const toolIds = clickCounts.map((row) => row.toolId);
  const tools =
    toolIds.length > 0
      ? await prisma.tool.findMany({
          where: { id: { in: toolIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const toolMap = Object.fromEntries(tools.map((tool) => [tool.id, tool]));

  const topTools = clickCounts.map((row) => ({
    toolId: row.toolId,
    name: toolMap[row.toolId]?.name ?? "Unknown",
    slug: toolMap[row.toolId]?.slug ?? "",
    clicks: row._count.id,
  }));

  return {
    totalClicks,
    todayClicks,
    weekClicks,
    monthClicks,
    topTools,
    dailyClicks,
    toolCount,
    affiliateCounts: Object.fromEntries(
      affiliateCounts.map((row) => [row.status, row._count.id])
    ),
    unassignedCount,
    followUpsDue,
    myAssigned,
    myOverdue,
    myInProgress,
    toolsMissingAffiliate,
    programsNoTool,
    userName: session.name,
  };
}
