import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncFollowUpNotificationsForUser } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    await syncFollowUpNotificationsForUser(session.id);

    const { searchParams } = request.nextUrl;
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where = {
      userId: session.id,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, unread, total] = await Promise.all([
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
    ]);

    return NextResponse.json({
      items,
      unread,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
