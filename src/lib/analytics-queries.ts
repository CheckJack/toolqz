import { prisma } from "@/lib/db";
import { isPostgresDatabase } from "@/lib/db-provider";

export type DailyClickRow = { date: string; count: number };

type ClickRange = "7d" | "30d" | "90d" | "all";

function normalizeRange(range: string): ClickRange {
  if (range === "7d" || range === "90d" || range === "all") return range;
  return "30d";
}

function normalizeRows(rows: { date: string | Date; count: bigint | number }[]): DailyClickRow[] {
  return rows.map((row) => ({
    date: typeof row.date === "string" ? row.date : row.date.toISOString().slice(0, 10),
    count: Number(row.count),
  }));
}

async function queryDailyClicksSqlite(range: ClickRange, toolId?: string): Promise<DailyClickRow[]> {
  if (toolId) {
    if (range === "all") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT date(clickedAt) as date, COUNT(*) as count
          FROM Click
          WHERE toolId = ${toolId} AND isBot = 0
          GROUP BY date(clickedAt)
          ORDER BY date ASC
        `
      );
    }
    if (range === "7d") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT date(clickedAt) as date, COUNT(*) as count
          FROM Click
          WHERE toolId = ${toolId} AND isBot = 0 AND clickedAt >= datetime('now', '-7 days')
          GROUP BY date(clickedAt)
          ORDER BY date ASC
        `
      );
    }
    if (range === "90d") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT date(clickedAt) as date, COUNT(*) as count
          FROM Click
          WHERE toolId = ${toolId} AND isBot = 0 AND clickedAt >= datetime('now', '-90 days')
          GROUP BY date(clickedAt)
          ORDER BY date ASC
        `
      );
    }
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT date(clickedAt) as date, COUNT(*) as count
        FROM Click
        WHERE toolId = ${toolId} AND isBot = 0 AND clickedAt >= datetime('now', '-30 days')
        GROUP BY date(clickedAt)
        ORDER BY date ASC
      `
    );
  }

  if (range === "all") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT date(clickedAt) as date, COUNT(*) as count
        FROM Click
        WHERE isBot = 0
        GROUP BY date(clickedAt)
        ORDER BY date ASC
      `
    );
  }
  if (range === "7d") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT date(clickedAt) as date, COUNT(*) as count
        FROM Click
        WHERE isBot = 0 AND clickedAt >= datetime('now', '-7 days')
        GROUP BY date(clickedAt)
        ORDER BY date ASC
      `
    );
  }
  if (range === "90d") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT date(clickedAt) as date, COUNT(*) as count
        FROM Click
        WHERE isBot = 0 AND clickedAt >= datetime('now', '-90 days')
        GROUP BY date(clickedAt)
        ORDER BY date ASC
      `
    );
  }
  return normalizeRows(
    await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(clickedAt) as date, COUNT(*) as count
      FROM Click
      WHERE isBot = 0 AND clickedAt >= datetime('now', '-30 days')
      GROUP BY date(clickedAt)
      ORDER BY date ASC
    `
  );
}

async function queryDailyClicksPostgres(range: ClickRange, toolId?: string): Promise<DailyClickRow[]> {
  if (toolId) {
    if (range === "all") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
          FROM "Click"
          WHERE "toolId" = ${toolId} AND "isBot" = false
          GROUP BY "clickedAt"::date
          ORDER BY date ASC
        `
      );
    }
    if (range === "7d") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
          FROM "Click"
          WHERE "toolId" = ${toolId} AND "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '7 days'
          GROUP BY "clickedAt"::date
          ORDER BY date ASC
        `
      );
    }
    if (range === "90d") {
      return normalizeRows(
        await prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
          FROM "Click"
          WHERE "toolId" = ${toolId} AND "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '90 days'
          GROUP BY "clickedAt"::date
          ORDER BY date ASC
        `
      );
    }
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Click"
        WHERE "toolId" = ${toolId} AND "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '30 days'
        GROUP BY "clickedAt"::date
        ORDER BY date ASC
      `
    );
  }

  if (range === "all") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Click"
        WHERE "isBot" = false
        GROUP BY "clickedAt"::date
        ORDER BY date ASC
      `
    );
  }
  if (range === "7d") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Click"
        WHERE "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '7 days'
        GROUP BY "clickedAt"::date
        ORDER BY date ASC
      `
    );
  }
  if (range === "90d") {
    return normalizeRows(
      await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Click"
        WHERE "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '90 days'
        GROUP BY "clickedAt"::date
        ORDER BY date ASC
      `
    );
  }
  return normalizeRows(
    await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT TO_CHAR("clickedAt"::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
      FROM "Click"
      WHERE "isBot" = false AND "clickedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY "clickedAt"::date
      ORDER BY date ASC
    `
  );
}

export async function queryDailyClicks(range: string, toolId?: string): Promise<DailyClickRow[]> {
  const normalized = normalizeRange(range);
  if (isPostgresDatabase()) {
    return queryDailyClicksPostgres(normalized, toolId);
  }
  return queryDailyClicksSqlite(normalized, toolId);
}
