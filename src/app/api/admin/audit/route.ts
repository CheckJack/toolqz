import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    const where = {
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("GET /api/admin/audit:", error);
    return handleAuthError(error, "Failed to load audit log");
  }
}
