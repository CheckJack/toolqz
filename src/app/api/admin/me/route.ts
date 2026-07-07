import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import {
  createSession,
  hashPassword,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPasswordLongEnough, passwordTooShortMessage } from "@/lib/password-policy";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailFollowUpReminders: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { affiliates: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailFollowUpReminders: user.emailFollowUpReminders,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      affiliateCount: user._count.affiliates,
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const existing = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true, passwordHash: true, emailFollowUpReminders: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: { name?: string; passwordHash?: string; emailFollowUpReminders?: boolean } =
      {};
    const auditParts: string[] = [];

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Name is required." }, { status: 400 });
      }
      if (name !== existing.name) {
        data.name = name;
        auditParts.push("name");
      }
    }

    if (body.newPassword !== undefined) {
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
      const currentPassword =
        typeof body.currentPassword === "string" ? body.currentPassword : "";

      if (!isPasswordLongEnough(newPassword)) {
        return NextResponse.json({ error: passwordTooShortMessage() }, { status: 400 });
      }
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const valid = await verifyPassword(currentPassword, existing.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      data.passwordHash = await hashPassword(newPassword);
      auditParts.push("password");
    }

    if (body.emailFollowUpReminders !== undefined) {
      const enabled = Boolean(body.emailFollowUpReminders);
      if (enabled !== existing.emailFollowUpReminders) {
        data.emailFollowUpReminders = enabled;
        auditParts.push(`email reminders ${enabled ? "on" : "off"}`);
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes to save." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailFollowUpReminders: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { affiliates: true } },
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    if (auditParts.length > 0) {
      await logAudit("update", "user", `${user.name}: updated ${auditParts.join(", ")}`, {
        userId: session.id,
        entityId: session.id,
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailFollowUpReminders: user.emailFollowUpReminders,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      affiliateCount: user._count.affiliates,
    });
  } catch (error) {
    return handleAuthError(error, "Failed to update profile");
  }
}
