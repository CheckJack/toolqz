import { clickRangeStartDate, parseSocialRange, type SocialRange } from "@/lib/analytics-ranges";

export async function fetchNewsletterTrend(range: SocialRange | "all"): Promise<{
  totalActive: number;
  newInRange: number;
  daily: { date: string; count: number }[];
}> {
  const { prisma } = await import("@/lib/db");

  const start =
    range === "all"
      ? null
      : range === "7d" || range === "30d" || range === "90d"
        ? (() => {
            const d = new Date();
            const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
            d.setDate(d.getDate() - days);
            d.setHours(0, 0, 0, 0);
            return d;
          })()
        : clickRangeStartDate(parseSocialRange(range) as never);

  const [totalActive, newInRange, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    start
      ? prisma.newsletterSubscriber.count({
          where: { status: "ACTIVE", subscribedAt: { gte: start } },
        })
      : prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    prisma.newsletterSubscriber.findMany({
      where: start ? { subscribedAt: { gte: start } } : undefined,
      select: { subscribedAt: true },
      orderBy: { subscribedAt: "asc" },
    }),
  ]);

  const byDate = new Map<string, number>();
  for (const sub of subscribers) {
    const date = sub.subscribedAt.toISOString().slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }

  const daily = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { totalActive, newInRange, daily };
}
