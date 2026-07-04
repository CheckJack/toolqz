import { prisma } from "@/lib/db";

export async function getAgentFinanceSummary() {
  const [earnings, expenses] = await Promise.all([
    prisma.financeEntry.aggregate({
      where: { type: "EARNING" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.financeEntry.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentEarnings, recentExpenses, recentItems] = await Promise.all([
    prisma.financeEntry.aggregate({
      where: { type: "EARNING", occurredAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: { type: "EXPENSE", occurredAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.financeEntry.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: {
        type: true,
        amount: true,
        currency: true,
        description: true,
        occurredAt: true,
      },
    }),
  ]);

  const totalEarnings = earnings._sum.amount ?? 0;
  const totalExpenses = expenses._sum.amount ?? 0;

  return {
    allTime: {
      earnings: totalEarnings,
      expenses: totalExpenses,
      net: totalEarnings - totalExpenses,
      earningCount: earnings._count.id,
      expenseCount: expenses._count.id,
    },
    last30Days: {
      earnings: recentEarnings._sum.amount ?? 0,
      expenses: recentExpenses._sum.amount ?? 0,
      net: (recentEarnings._sum.amount ?? 0) - (recentExpenses._sum.amount ?? 0),
    },
    recent: recentItems.map((e) => ({
      type: e.type,
      amount: e.amount,
      currency: e.currency,
      description: e.description,
      date: e.occurredAt.toISOString().slice(0, 10),
    })),
  };
}
