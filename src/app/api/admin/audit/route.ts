import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 50;

const ENTITY_KEYS = [
  "tool",
  "affiliate",
  "user",
  "finance",
  "subscriber",
  "category",
  "blog_post",
] as const;

function searchWhere(search: string) {
  if (!search) return {};
  return {
    OR: [
      { detail: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
    ],
  };
}

function buildFilterWhere(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim() ?? "";
  const action = searchParams.get("action")?.trim() ?? "";
  const entity = searchParams.get("entity")?.trim() ?? "";

  const baseWhere = {
    ...searchWhere(search),
    ...(action ? { action } : {}),
  };

  return {
    baseWhere,
    where: {
      ...baseWhere,
      ...(entity ? { entity } : {}),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const { baseWhere, where } = buildFilterWhere(searchParams);

    const [items, total, allCount, ...entityCounts] = await Promise.all([
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
      prisma.adminAuditLog.count({ where: baseWhere }),
      ...ENTITY_KEYS.map((entity) =>
        prisma.adminAuditLog.count({ where: { ...baseWhere, entity } })
      ),
    ]);

    const counts: Record<string, number> = { all: allCount };
    ENTITY_KEYS.forEach((entity, index) => {
      counts[entity] = entityCounts[index];
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    console.error("GET /api/admin/audit:", error);
    return handleAuthError(error, "Failed to load audit log");
  }
}
