import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { hashPassword, requireAdmin, requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { isPasswordLongEnough, passwordTooShortMessage } from "@/lib/password-policy";

export async function GET() {
  try {
    await requireSession();

    const users = await prisma.user.findMany({
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        emailFollowUpReminders: u.emailFollowUpReminders,
        affiliateCount: u._count.affiliates,
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/users:", error);
    return handleAuthError(error, "Failed to load team");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!isPasswordLongEnough(password)) {
      return NextResponse.json({ error: passwordTooShortMessage() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    await logAudit("create", "user", `Added team member ${user.name} (${user.role})`, {
      userId: session.id,
      entityId: user.id,
    });

    return NextResponse.json({
      ...user,
      affiliateCount: 0,
      emailFollowUpReminders: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
