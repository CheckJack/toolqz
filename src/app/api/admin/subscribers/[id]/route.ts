import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const data: {
      name?: string | null;
      status?: string;
      unsubscribedAt?: Date | null;
      subscribedAt?: Date;
    } = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim() || null;
    }

    if (body.status === "ACTIVE" || body.status === "UNSUBSCRIBED") {
      data.status = body.status;
      if (body.status === "UNSUBSCRIBED") {
        data.unsubscribedAt = new Date();
      } else {
        data.unsubscribedAt = null;
        data.subscribedAt = new Date();
      }
    }

    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data,
    });

    await logAudit(
      "update",
      "subscriber",
      `${updated.status === "UNSUBSCRIBED" ? "Unsubscribed" : "Updated"} ${updated.email}`,
      { userId: session.id, entityId: updated.id }
    );

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error, "Failed to update subscriber");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    await prisma.newsletterSubscriber.delete({ where: { id } });

    await logAudit("delete", "subscriber", `Deleted ${existing.email}`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete subscriber");
  }
}
