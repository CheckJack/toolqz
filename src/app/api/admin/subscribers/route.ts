import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidEmail, normalizeEmail } from "@/lib/subscribers";

const DEFAULT_PAGE_SIZE = 25;

function buildWhere(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const where: {
    status?: string;
    OR?: Array<{ email: { contains: string } } | { name: { contains: string } }>;
  } = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const where = buildWhere(searchParams);

    const [items, total, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      items,
      total,
      activeCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load subscribers");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const name = typeof body.name === "string" ? body.name.trim() || null : null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing) {
      const updated = await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          name: name ?? existing.name,
          status: "ACTIVE",
          source: "manual",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

      await logAudit("update", "subscriber", `Reactivated ${email}`, {
        userId: session.id,
        entityId: updated.id,
      });

      return NextResponse.json(updated);
    }

    const created = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        source: "manual",
        status: "ACTIVE",
      },
    });

    await logAudit("create", "subscriber", `Added ${email}`, {
      userId: session.id,
      entityId: created.id,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to add subscriber");
  }
}
