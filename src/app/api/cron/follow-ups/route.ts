import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { followUpDigestEmail, type FollowUpDigestItem } from "@/lib/email-templates";
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

  let inAppCreated = 0;
  let skipped = 0;
  const digestItems: FollowUpDigestItem[] = [];

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

    digestItems.push({
      companyName: program.companyName,
      dueDate,
      assigneeName: assignee.name,
      href,
    });

    await prisma.affiliateProgram.update({
      where: { id: program.id },
      data: { followUpNotifiedAt: now },
    });
  }

  let emailsSent = 0;
  if (digestItems.length > 0) {
    const members = await prisma.user.findMany({
      where: { emailFollowUpReminders: true },
      select: { email: true, name: true },
    });

    for (const member of members) {
      const mail = followUpDigestEmail(member.name, digestItems);
      try {
        await sendEmail({
          to: member.email,
          toName: member.name,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        emailsSent++;
      } catch (error) {
        console.error(`Follow-up digest email failed for ${member.email}:`, error);
      }
    }
  }

  return NextResponse.json({
    emailsSent,
    inAppCreated,
    skipped,
    digestItems: digestItems.length,
    membersNotified: digestItems.length > 0 ? emailsSent : 0,
    checked: programs.length,
  });
}
