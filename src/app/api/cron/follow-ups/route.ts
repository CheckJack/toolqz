import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification, processDueFollowUpNotifications } from "@/lib/notifications";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const programs = await processDueFollowUpNotifications();

  let emailsSent = 0;
  let inAppCreated = 0;
  let skipped = 0;

  for (const program of programs) {
    if (
      program.followUpNotifiedAt &&
      program.nextFollowUpAt &&
      program.followUpNotifiedAt >= program.nextFollowUpAt
    ) {
      skipped++;
      continue;
    }

    const assignee = program.assignedTo;
    if (!assignee) {
      skipped++;
      continue;
    }

    const dueDate = program.nextFollowUpAt
      ? program.nextFollowUpAt.toLocaleDateString()
      : "soon";
    const href = `/admin/affiliates/${program.id}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const existingNotification = await prisma.adminNotification.findFirst({
      where: {
        userId: assignee.id,
        entityId: program.id,
        type: "follow_up_due",
        createdAt: program.nextFollowUpAt
          ? { gte: program.nextFollowUpAt }
          : undefined,
      },
    });

    if (!existingNotification) {
      await createNotification({
        userId: assignee.id,
        type: "follow_up_due",
        title: `Follow-up due: ${program.companyName}`,
        body: `Due ${dueDate}`,
        href,
        entityId: program.id,
      });
      inAppCreated++;
    }

    if (assignee.email && assignee.emailFollowUpReminders) {
      try {
        await sendEmail({
          to: assignee.email,
          subject: `Follow-up due: ${program.companyName}`,
          text: `Hi ${assignee.name},\n\nFollow-up for ${program.companyName} is due (${dueDate}).\n\nOpen CRM: ${appUrl}${href}`,
        });
        emailsSent++;
      } catch {
        // In-app notification still created
      }
    }

    await prisma.affiliateProgram.update({
      where: { id: program.id },
      data: { followUpNotifiedAt: now },
    });
  }

  return NextResponse.json({
    emailsSent,
    inAppCreated,
    skipped,
    checked: programs.length,
  });
}
