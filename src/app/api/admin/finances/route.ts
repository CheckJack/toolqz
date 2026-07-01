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
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );

    const where = {
      ...(type && isFinanceType(type) ? { type } : {}),
    };

    const [items, total, summary] = await Promise.all([
      prisma.financeEntry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.financeEntry.count({ where }),
      summaryForWhere(where),
    ]);

    return NextResponse.json({
      items: items.map(serializeEntry),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary,
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
