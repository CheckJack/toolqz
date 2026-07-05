import { prisma } from "@/lib/db";
import { sendTelegramAlert } from "@/lib/telegram";

const TELEGRAM_NOTIFY_TYPES = new Set([
  "follow_up_due",
  "partner_inquiry",
  "tool_published",
  "affiliate_status",
  "team_message",
  "build_running",
  "build_completed",
  "build_failed",
  "site_down",
  "site_recovered",
  "task_completed",
]);

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  entityId?: string | null;
}) {
  const notification = await prisma.adminNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      entityId: input.entityId ?? null,
    },
  });

  if (TELEGRAM_NOTIFY_TYPES.has(input.type) || input.type.startsWith("agent_")) {
    void sendTelegramAlert(input.title, input.body, input.href);
  }

  return notification;
}

export async function notifyTeamMembers(input: {
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  entityId?: string | null;
  excludeUserId?: string | null;
}) {
  const users = await prisma.user.findMany({
    where: input.excludeUserId ? { id: { not: input.excludeUserId } } : undefined,
    select: { id: true },
    orderBy: { name: "asc" },
  });

  let created = 0;
  for (const user of users) {
    await createNotification({
      userId: user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      entityId: input.entityId,
    });
    created++;
  }

  return created;
}

export async function notifyTaskCompleted(input: {
  taskId: string;
  taskTitle: string;
  completedByUserId: string;
  completedByName: string;
  linkUrl?: string | null;
}) {
  return notifyTeamMembers({
    type: "task_completed",
    title: `${input.completedByName} completed a task`,
    body: input.taskTitle,
    href: input.linkUrl?.startsWith("/") ? input.linkUrl : "/admin/tasks",
    entityId: input.taskId,
    excludeUserId: input.completedByUserId,
  });
}

export async function notifyBuildStatus(input: {
  status: "running" | "completed" | "failed";
  domain: string;
  buildId: string;
}) {
  const titles = {
    running: "Deploy started",
    completed: "Deploy completed",
    failed: "Deploy failed",
  };
  const bodies = {
    running: `${input.domain} is building`,
    completed: `${input.domain} deploy finished successfully`,
    failed: `${input.domain} deploy failed`,
  };

  return notifyTeamMembers({
    type: `build_${input.status}`,
    title: titles[input.status],
    body: bodies[input.status],
    href: "/admin/hosting",
    entityId: input.buildId,
  });
}

export async function notifySiteStatus(input: {
  healthy: boolean;
  domain: string;
  statusCode: number;
  detail?: string | null;
}) {
  return notifyTeamMembers({
    type: input.healthy ? "site_recovered" : "site_down",
    title: input.healthy ? "Site is back online" : "Site is down",
    body: input.healthy
      ? `${input.domain} is responding (HTTP ${input.statusCode})`
      : input.detail ?? `${input.domain} returned HTTP ${input.statusCode}`,
    href: "/admin/hosting",
    entityId: `${input.healthy ? "recovered" : "down"}:${input.statusCode}`,
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
