import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_CURRENCY, isFinanceType, parseFinanceAmount } from "@/lib/finance";

const DEFAULT_PAGE_SIZE = 25;
const entryInclude = {
  affiliateProgram: { select: { id: true, companyName: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

function parseOccurredAt(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function summaryForWhere(where: Record<string, unknown>) {
  const [earningsAgg, expensesAgg] = await Promise.all([
    prisma.financeEntry.aggregate({
      where: { ...where, type: "EARNING" },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);
  const earnings = earningsAgg._sum.amount ?? 0;
  const expenses = expensesAgg._sum.amount ?? 0;
  return { earnings, expenses, balance: earnings - expenses };
}

async function getMonthlyTrend() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const entries = await prisma.financeEntry.findMany({
    where: { occurredAt: { gte: start } },
    select: { type: true, amount: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  });

  const buckets = new Map<string, { earnings: number; expenses: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { earnings: 0, expenses: 0 });
  }

  for (const entry of entries) {
    const key = `${entry.occurredAt.getFullYear()}-${String(entry.occurredAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (entry.type === "EARNING") bucket.earnings += entry.amount;
    else bucket.expenses += entry.amount;
  }

  return [...buckets.entries()].map(([month, values]) => ({
    month,
    label: new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    earnings: Math.round(values.earnings * 100) / 100,
    expenses: Math.round(values.expenses * 100) / 100,
    net: Math.round((values.earnings - values.expenses) * 100) / 100,
  }));
}

function serializeEntry(entry: {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  source: string | null;
  affiliateProgramId: string | null;
  occurredAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  affiliateProgram: { id: string; companyName: string } | null;
  createdBy: { id: string; name: string } | null;
}) {
  return {
    ...entry,
    occurredAt: entry.occurredAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );

    const baseWhere = {
      ...(search
        ? {
            OR: [
              { description: { contains: search } },
              { source: { contains: search } },
              { notes: { contains: search } },
            ],
          }
        : {}),
    };

    const where = {
      ...baseWhere,
      ...(type && isFinanceType(type) ? { type } : {}),
    };

    const [items, total, summary, monthlyTrend, allCount, earningCount, expenseCount] =
      await Promise.all([
      prisma.financeEntry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.financeEntry.count({ where }),
      summaryForWhere({}),
      getMonthlyTrend(),
      prisma.financeEntry.count({ where: baseWhere }),
      prisma.financeEntry.count({ where: { ...baseWhere, type: "EARNING" } }),
      prisma.financeEntry.count({ where: { ...baseWhere, type: "EXPENSE" } }),
    ]);

    return NextResponse.json({
      items: items.map(serializeEntry),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary,
      monthlyTrend,
      counts: { all: allCount, EARNING: earningCount, EXPENSE: expenseCount },
    });
  } catch (error) {
    console.error("GET /api/admin/finances:", error);
    return handleAuthError(error, "Failed to load finances");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const type = typeof body.type === "string" ? body.type : "";
    if (!isFinanceType(type)) {
      return NextResponse.json({ error: "Type must be EARNING or EXPENSE" }, { status: 400 });
    }

    const amount = parseFinanceAmount(body.amount);
    if (amount === null) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const occurredAt = parseOccurredAt(body.occurredAt) ?? new Date();
    const source = typeof body.source === "string" ? body.source.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    const currency =
      typeof body.currency === "string" && body.currency.trim()
        ? body.currency.trim().toUpperCase()
        : DEFAULT_CURRENCY;

    let affiliateProgramId: string | null = null;
    if (typeof body.affiliateProgramId === "string" && body.affiliateProgramId) {
      const program = await prisma.affiliateProgram.findUnique({
        where: { id: body.affiliateProgramId },
        select: { id: true },
      });
      if (!program) {
        return NextResponse.json({ error: "Affiliate program not found" }, { status: 404 });
      }
      affiliateProgramId = program.id;
    }

    const entry = await prisma.financeEntry.create({
      data: {
        type,
        amount,
        currency,
        description,
        source,
        notes,
        affiliateProgramId,
        occurredAt,
        createdById: session.id,
      },
      include: entryInclude,
    });

    await logAudit(
      "create",
      "finance",
      `${type === "EARNING" ? "Earning" : "Expense"}: ${description} (${amount} ${currency})`,
      { userId: session.id, entityId: entry.id }
    );

    const summary = await summaryForWhere({});

    return NextResponse.json({ entry: serializeEntry(entry), summary }, { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to add entry");
  }
}
