import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { countUnreadMessages } from "@/lib/team-chat";

export async function GET() {
  try {
    const session = await requireSession();
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);

    const inactiveStatuses = ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] as const;

    const [myOverdue, followUpsDue, unreadMessages] = await Promise.all([
      prisma.affiliateProgram.count({
        where: {
          assignedToId: session.id,
          nextFollowUpAt: { lt: now },
          status: { notIn: [...inactiveStatuses] },
        },
      }),
      prisma.affiliateProgram.count({
        where: {
          nextFollowUpAt: { lte: weekAhead },
          status: { notIn: [...inactiveStatuses] },
        },
      }),
      countUnreadMessages(session.id),
    ]);

    return NextResponse.json({ myOverdue, followUpsDue, unreadMessages });
  } catch (error) {
    return handleAuthError(error, "Failed to load counts");
  }
}
