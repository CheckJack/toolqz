import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { isPasswordLongEnough, passwordTooShortMessage } from "@/lib/password-policy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true, emailFollowUpReminders: true },
    });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) {
      data.role = body.role === "ADMIN" ? "ADMIN" : "MEMBER";
    }
    if (body.emailFollowUpReminders !== undefined) {
      data.emailFollowUpReminders = Boolean(body.emailFollowUpReminders);
    }
    if (body.password) {
      if (!isPasswordLongEnough(String(body.password))) {
        return NextResponse.json({ error: passwordTooShortMessage() }, { status: 400 });
      }
      data.passwordHash = await hashPassword(String(body.password));
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        emailFollowUpReminders: true,
        _count: { select: { affiliates: true } },
      },
    });

    if (body.role !== undefined && existing && existing.role !== user.role) {
      await logAudit(
        "role_change",
        "user",
        `${existing.name}: ${existing.role} → ${user.role}`,
        { userId: session.id, entityId: id }
      );
    }

    if (
      body.emailFollowUpReminders !== undefined &&
      existing &&
      existing.emailFollowUpReminders !== user.emailFollowUpReminders
    ) {
      await logAudit(
        "update",
        "user",
        `${user.name}: email reminders ${user.emailFollowUpReminders ? "on" : "off"}`,
        { userId: session.id, entityId: id }
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      emailFollowUpReminders: user.emailFollowUpReminders,
      affiliateCount: user._count.affiliates,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    if (session.id === id) {
      return NextResponse.json(
        { error: "You cannot remove your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, email: true, _count: { select: { affiliates: true } } },
    });

    await prisma.affiliateProgram.updateMany({
      where: { assignedToId: id },
      data: { assignedToId: null },
    });

    await prisma.user.delete({ where: { id } });

    await logAudit(
      "delete",
      "user",
      user
        ? `Removed ${user.name} (${user._count.affiliates} programs unassigned)`
        : undefined,
      { userId: session.id, entityId: id }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
