import { prisma } from "@/lib/db";

export async function getMyWorkSummary(userId: string) {
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);

  const [
    myAssigned,
    myOverdue,
    myInProgress,
    draftTools,
    toolsMissingAffiliate,
    programsNoTool,
    overduePrograms,
    followUpsDue,
  ] = await Promise.all([
    prisma.affiliateProgram.count({ where: { assignedToId: userId } }),
    prisma.affiliateProgram.count({
      where: {
        assignedToId: userId,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
      },
    }),
    prisma.affiliateProgram.count({
      where: { assignedToId: userId, status: "IN_PROGRESS" },
    }),
    prisma.tool.count({ where: { published: false } }),
    prisma.tool.count({ where: { published: true, affiliateUrl: null } }),
    prisma.affiliateProgram.count({ where: { toolId: null } }),
    prisma.affiliateProgram.findMany({
      where: {
        assignedToId: userId,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
      },
      select: { id: true, companyName: true, nextFollowUpAt: true, status: true },
      orderBy: { nextFollowUpAt: "asc" },
      take: 8,
    }),
    prisma.affiliateProgram.count({
      where: {
        nextFollowUpAt: { lte: weekAhead },
        status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
      },
    }),
  ]);

  return {
    myAssigned,
    myOverdue,
    myInProgress,
    draftTools,
    toolsMissingAffiliate,
    programsNoTool,
    followUpsDue,
    overduePrograms: overduePrograms.map((p) => ({
      companyName: p.companyName,
      status: p.status,
      due: p.nextFollowUpAt?.toISOString().slice(0, 10) ?? "—",
      editUrl: `/admin/affiliates/${p.id}`,
    })),
  };
}
