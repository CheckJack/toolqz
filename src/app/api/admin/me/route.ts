import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return handleAuthError(error, "Failed to load profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const data: { emailFollowUpReminders?: boolean } = {};
    if (body.emailFollowUpReminders !== undefined) {
      data.emailFollowUpReminders = Boolean(body.emailFollowUpReminders);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
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
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleAuthError(error, "Failed to update profile");
  }
}
