import { TASK_SECTION_LABELS } from "@/constants/admin-tasks";
import { isTaskOverdue } from "@/lib/admin-tasks";
import { taskDigestEmail, type TaskDigestItem } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

function formatDueLabel(dueAt: Date | null): string | null {
  if (!dueAt) return null;
  return dueAt.toLocaleDateString("en-GB", { timeZone: "Europe/Lisbon" });
}

function isSchemaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("emailTaskDigest") ||
    msg.includes("AdminTask") ||
    msg.includes("SystemMonitorState") ||
    msg.includes("does not exist") ||
    msg.includes("Unknown column")
  );
}

export async function runDailyTaskDigest() {
  let users: { id: string; email: string; name: string }[];

  try {
    users = await prisma.user.findMany({
      where: { emailTaskDigest: true },
      select: { id: true, email: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (!isSchemaError(error)) throw error;
    users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  let emailsSent = 0;
  let usersWithTasks = 0;
  let schemaFallback = false;

  for (const user of users) {
    type TaskRow = Awaited<ReturnType<typeof prisma.adminTask.findMany>>[number];
    let tasks: TaskRow[] = [];
    try {
      tasks = await prisma.adminTask.findMany({
        where: {
          assignedToId: user.id,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { sortOrder: "asc" }],
        take: 50,
      });
    } catch (error) {
      if (!isSchemaError(error)) throw error;
      schemaFallback = true;
      tasks = [];
    }

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
    schemaFallback,
  };
}
