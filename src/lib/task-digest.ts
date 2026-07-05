import { TASK_SECTION_LABELS } from "@/constants/admin-tasks";
import { isTaskOverdue } from "@/lib/admin-tasks";
import { taskDigestEmail, type TaskDigestItem } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

function formatDueLabel(dueAt: Date | null): string | null {
  if (!dueAt) return null;
  return dueAt.toLocaleDateString("en-GB", { timeZone: "Europe/Lisbon" });
}

export async function runDailyTaskDigest() {
  const users = await prisma.user.findMany({
    where: { emailTaskDigest: true },
    select: { id: true, email: true, name: true },
    orderBy: { name: "asc" },
  });

  let emailsSent = 0;
  let usersWithTasks = 0;

  for (const user of users) {
    const tasks = await prisma.adminTask.findMany({
      where: {
        assignedToId: user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { sortOrder: "asc" }],
      take: 50,
    });

    const items: TaskDigestItem[] = tasks.map((task) => ({
      title: task.title,
      section: TASK_SECTION_LABELS[task.section as keyof typeof TASK_SECTION_LABELS] ?? task.section,
      status: task.status === "IN_PROGRESS" ? "In progress" : "To do",
      priority: task.priority,
      dueLabel: formatDueLabel(task.dueAt),
      href: task.linkUrl?.startsWith("/") ? task.linkUrl : `/admin/tasks`,
      overdue: isTaskOverdue(task.dueAt?.toISOString() ?? null, task.status),
    }));

    if (items.length > 0) usersWithTasks++;

    const mail = taskDigestEmail(user.name, items);
    try {
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      emailsSent++;
    } catch (error) {
      console.error(`[task-digest] email failed for ${user.email}:`, error);
    }
  }

  return {
    ok: true,
    emailsSent,
    users: users.length,
    usersWithTasks,
  };
}
