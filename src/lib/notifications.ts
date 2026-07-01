import { prisma } from "@/lib/db";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  entityId?: string | null;
}) {
  return prisma.adminNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      entityId: input.entityId ?? null,
    },
  });
}

export async function syncFollowUpNotificationsForUser(userId: string) {
  const now = new Date();
  const programs = await prisma.affiliateProgram.findMany({
    where: {
      assignedToId: userId,
      nextFollowUpAt: { lte: now },
      status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
    },
    select: {
      id: true,
      companyName: true,
      nextFollowUpAt: true,
      followUpNotifiedAt: true,
    },
  });

  let created = 0;
  for (const program of programs) {
    if (
      program.followUpNotifiedAt &&
      program.nextFollowUpAt &&
      program.followUpNotifiedAt >= program.nextFollowUpAt
    ) {
      continue;
    }

    const existing = await prisma.adminNotification.findFirst({
      where: {
        userId,
        entityId: program.id,
        type: "follow_up_due",
        createdAt: program.nextFollowUpAt
          ? { gte: program.nextFollowUpAt }
          : undefined,
      },
    });
    if (existing) continue;

    await createNotification({
      userId,
      type: "follow_up_due",
      title: `Follow-up due: ${program.companyName}`,
      body: program.nextFollowUpAt
        ? `Due ${program.nextFollowUpAt.toLocaleDateString()}`
        : "Follow-up is overdue",
      href: `/admin/affiliates/${program.id}`,
      entityId: program.id,
    });
    created++;
  }

  return created;
}

export async function processDueFollowUpNotifications() {
  const now = new Date();
  const programs = await prisma.affiliateProgram.findMany({
    where: {
      nextFollowUpAt: { lte: now },
      status: { notIn: ["ACTIVE", "REJECTED", "NOT_AVAILABLE"] },
      assignedToId: { not: null },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          email: true,
          name: true,
          emailFollowUpReminders: true,
        },
      },
    },
  });

  return programs;
}
