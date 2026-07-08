import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = request.nextUrl;
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where = {
      userId: session.id,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, unread, total, allTotal] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.adminNotification.count({
        where: { userId: session.id, readAt: null },
      }),
      prisma.adminNotification.count({ where }),
      prisma.adminNotification.count({ where: { userId: session.id } }),
    ]);

    return NextResponse.json({
      items,
      unread,
      total,
      allTotal,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load notifications");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (body.markAllRead) {
      await prisma.adminNotification.updateMany({
        where: { userId: session.id, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await prisma.adminNotification.updateMany({
        where: { id: String(body.id), userId: session.id },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return handleAuthError(error, "Failed to update notifications");
  }
}
