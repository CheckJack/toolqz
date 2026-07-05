import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/affiliates";

const MAX_EXPORT = 5000;

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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    const where = {
      ...searchWhere(search),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    };

    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const csv = toCsv([
      ["When", "Who", "Email", "Action", "Entity", "Entity ID", "Detail"],
      ...logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.user?.name ?? "System",
        log.user?.email ?? "",
        log.action,
        log.entity,
        log.entityId ?? "",
        log.detail ?? "",
      ]),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="toolqz-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleAuthError(error, "Failed to export audit log");
  }
}
