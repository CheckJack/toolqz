import { prisma } from "@/lib/db";
import {
  normalizeTaskPriority,
  normalizeTaskSection,
  normalizeTaskStatus,
  parseTaskDueAt,
} from "@/lib/admin-tasks";
import { isTaskSection, isTaskStatus, TASK_SECTIONS } from "@/constants/admin-tasks";
import { notifyTaskCompleted } from "@/lib/notifications";

const taskInclude = {
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

export function serializeAgentTask(task: {
  id: string;
  title: string;
  description: string | null;
  section: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  linkUrl: string | null;
  assignedTo: { id: string; name: string } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    section: task.section,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString().slice(0, 10) ?? null,
    assignee: task.assignedTo?.name ?? null,
    tasksUrl: "/admin/tasks",
  };
}

export async function findAdminTask(args: Record<string, unknown>) {
  const id = typeof args.task_id === "string" ? args.task_id.trim() : "";
  const title = typeof args.task_title === "string" ? args.task_title.trim() : "";

  if (id) {
    return prisma.adminTask.findUnique({ where: { id }, include: taskInclude });
  }
  if (title) {
    return prisma.adminTask.findFirst({
      where: { title: { contains: title } },
      include: taskInclude,
      orderBy: { updatedAt: "desc" },
    });
  }
  return null;
}

export async function resolveTaskAssigneeId(
  args: Record<string, unknown>,
  actorUserId: string
): Promise<string | null | undefined> {
  if (args.assign_to_me === true) return actorUserId;

  if (args.assigned_to_id === null || args.assigned_to_id === "") return null;

  const assigneeId =
    typeof args.assigned_to_id === "string" ? args.assigned_to_id.trim() : "";
  if (assigneeId) {
    const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
    if (!user) throw new Error("Assignee user not found");
    return user.id;
  }

  const assigneeName =
    typeof args.assignee_name === "string" ? args.assignee_name.trim() : "";
  if (assigneeName) {
    const user = await prisma.user.findFirst({
      where: { name: { contains: assigneeName } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (!user) throw new Error(`No team member matching "${assigneeName}"`);
    return user.id;
  }

  return undefined;
}

export async function listAdminTasksForAgent(args: Record<string, unknown>, userId: string) {
  const section = typeof args.section === "string" ? args.section.trim() : "";
  const status = typeof args.status === "string" ? args.status.trim().toUpperCase() : "";
  const search = typeof args.search === "string" ? args.search.trim() : "";
  const assignee = typeof args.assignee === "string" ? args.assignee.trim() : "";
  const overdueOnly = args.overdue_only === true;
  const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

  const where = {
    ...(section && isTaskSection(section) ? { section } : {}),
    ...(status && isTaskStatus(status) ? { status } : {}),
    ...(assignee === "me"
      ? { assignedToId: userId }
      : assignee === "unassigned"
        ? { assignedToId: null }
        : {}),
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { description: { contains: search } }],
        }
      : {}),
    ...(overdueOnly
      ? {
          status: { not: "DONE" },
          dueAt: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adminTask.findMany({
      where,
      include: taskInclude,
      orderBy: [{ sortOrder: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: limit,
    }),
    prisma.adminTask.count({ where }),
  ]);

  const tasks = items.map(serializeAgentTask);
  const sectionCounts = Object.fromEntries(
    TASK_SECTIONS.map((s) => [s.value, 0])
  );
  if (!section && !status && !search && !assignee && !overdueOnly) {
    const grouped = await prisma.adminTask.groupBy({ by: ["section"], _count: { id: true } });
    for (const row of grouped) {
      sectionCounts[row.section] = row._count.id;
    }
  }

  return { total, showing: items.length, tasks, sectionCounts };
}

export async function createAdminTaskForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  if (!title) throw new Error("create_task requires a title");

  const section = normalizeTaskSection(args.section);
  const status = normalizeTaskStatus(args.status);
  const priority = normalizeTaskPriority(args.priority);
  const description =
    typeof args.description === "string" ? args.description.trim() || null : null;
  const dueAt = parseTaskDueAt(args.due_at);
  const linkUrl = typeof args.link_url === "string" ? args.link_url.trim() || null : null;

  const assigneeResolved = await resolveTaskAssigneeId(args, userId);
  const assignedToId = assigneeResolved === undefined ? null : assigneeResolved;

  const maxOrder = await prisma.adminTask.aggregate({
    where: { section, status },
    _max: { sortOrder: true },
  });

  const task = await prisma.adminTask.create({
    data: {
      title,
      description,
      section,
      status,
      priority,
      dueAt,
      linkUrl,
      assignedToId,
      createdById: userId,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      completedAt: status === "DONE" ? new Date() : null,
    },
    include: taskInclude,
  });

  return serializeAgentTask(task);
}

export async function updateAdminTaskForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const task = await findAdminTask(args);
  if (!task) throw new Error("Task not found — provide task_id or task_title");

  const wasDone = task.status === "DONE";

  const data: {
    title?: string;
    description?: string | null;
    section?: string;
    status?: string;
    priority?: string;
    dueAt?: Date | null;
    linkUrl?: string | null;
    assignedToId?: string | null;
    completedAt?: Date | null;
  } = {};

  if (args.title !== undefined) {
    const title = typeof args.title === "string" ? args.title.trim() : "";
    if (!title) throw new Error("title cannot be empty");
    data.title = title;
  }

  if (args.description !== undefined) {
    data.description =
      typeof args.description === "string" ? args.description.trim() || null : null;
  }

  if (args.section !== undefined) data.section = normalizeTaskSection(args.section);
  if (args.priority !== undefined) data.priority = normalizeTaskPriority(args.priority);
  if (args.due_at !== undefined) data.dueAt = parseTaskDueAt(args.due_at);

  if (args.link_url !== undefined) {
    data.linkUrl = typeof args.link_url === "string" ? args.link_url.trim() || null : null;
  }

  const assigneeResolved = await resolveTaskAssigneeId(args, userId);
  if (assigneeResolved !== undefined) data.assignedToId = assigneeResolved;

  if (args.status !== undefined) {
    const status = normalizeTaskStatus(args.status);
    data.status = status;
    data.completedAt = status === "DONE" ? new Date() : null;
  }

  if (args.mark_done === true) {
    data.status = "DONE";
    data.completedAt = new Date();
  }

  const updated = await prisma.adminTask.update({
    where: { id: task.id },
    data,
    include: taskInclude,
  });

  if (updated.status === "DONE" && !wasDone) {
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    void notifyTaskCompleted({
      taskId: updated.id,
      taskTitle: updated.title,
      completedByUserId: userId,
      completedByName: actor?.name ?? "A team member",
      linkUrl: updated.linkUrl,
    });
  }

  return serializeAgentTask(updated);
}

export async function getAdminTaskSummaryForUser(userId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [assignedToMe, myTodo, myInProgress, myOverdue, overdueItems] = await Promise.all([
    prisma.adminTask.count({ where: { assignedToId: userId } }),
    prisma.adminTask.count({ where: { assignedToId: userId, status: "TODO" } }),
    prisma.adminTask.count({ where: { assignedToId: userId, status: "IN_PROGRESS" } }),
    prisma.adminTask.count({
      where: {
        assignedToId: userId,
        status: { not: "DONE" },
        dueAt: { lt: todayStart },
      },
    }),
    prisma.adminTask.findMany({
      where: {
        assignedToId: userId,
        status: { not: "DONE" },
        dueAt: { lt: todayStart },
      },
      include: taskInclude,
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
  ]);

  return {
    assignedToMe,
    myTodo,
    myInProgress,
    myOverdue,
    overdueTasks: overdueItems.map((t) => ({
      title: t.title,
      due: t.dueAt?.toISOString().slice(0, 10) ?? "—",
      status: t.status,
      section: t.section,
      tasksUrl: "/admin/tasks",
    })),
  };
}
