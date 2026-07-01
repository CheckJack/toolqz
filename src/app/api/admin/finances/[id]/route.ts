import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_CURRENCY, isFinanceType, parseFinanceAmount } from "@/lib/finance";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.financeEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      type?: string;
      amount?: number;
      currency?: string;
      description?: string;
      source?: string | null;
      notes?: string | null;
      affiliateProgramId?: string | null;
      occurredAt?: Date;
    } = {};

    if (body.type !== undefined) {
      if (!isFinanceType(body.type)) {
        return NextResponse.json({ error: "Type must be EARNING or EXPENSE" }, { status: 400 });
      }
      data.type = body.type;
    }

    if (body.amount !== undefined) {
      const amount = parseFinanceAmount(body.amount);
      if (amount === null) {
        return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
      }
      data.amount = amount;
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (!description) {
        return NextResponse.json({ error: "Description is required" }, { status: 400 });
      }
      data.description = description;
    }

    if (body.source !== undefined) {
      data.source = typeof body.source === "string" ? body.source.trim() || null : null;
    }

    if (body.notes !== undefined) {
      data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    }

    if (body.currency !== undefined) {
      data.currency =
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim().toUpperCase()
          : DEFAULT_CURRENCY;
    }

    if (body.occurredAt !== undefined) {
      const occurredAt = parseOccurredAt(body.occurredAt);
      if (!occurredAt) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      data.occurredAt = occurredAt;
    }

    if (body.affiliateProgramId !== undefined) {
      if (body.affiliateProgramId === null || body.affiliateProgramId === "") {
        data.affiliateProgramId = null;
      } else if (typeof body.affiliateProgramId === "string") {
        const program = await prisma.affiliateProgram.findUnique({
          where: { id: body.affiliateProgramId },
          select: { id: true },
        });
        if (!program) {
          return NextResponse.json({ error: "Affiliate program not found" }, { status: 404 });
        }
        data.affiliateProgramId = program.id;
      }
    }

    const entry = await prisma.financeEntry.update({
      where: { id },
      data,
      include: entryInclude,
    });

    await logAudit("update", "finance", `Updated ${entry.description}`, {
      userId: session.id,
      entityId: entry.id,
    });

    return NextResponse.json({ entry: serializeEntry(entry) });
  } catch (error) {
    return handleAuthError(error, "Failed to update entry");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const existing = await prisma.financeEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.financeEntry.delete({ where: { id } });

    await logAudit("delete", "finance", `Deleted ${existing.description}`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete entry");
  }
}
