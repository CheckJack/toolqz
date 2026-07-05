import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import {
  normalizeTaskPriority,
  normalizeTaskSection,
  normalizeTaskStatus,
  parseTaskDueAt,
} from "@/lib/admin-tasks";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isTaskSection, isTaskStatus, TASK_SECTIONS } from "@/constants/admin-tasks";

const taskInclude = {
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

function serializeTask(task: {
  id: string;
  title: string;
  description: string | null;
  section: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  sortOrder: number;
  linkUrl: string | null;
  linkLabel: string | null;
  assignedToId: string | null;
  createdById: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
}) {
  return {
    ...task,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const section = searchParams.get("section")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const assignee = searchParams.get("assignee")?.trim() ?? "";
    const search = searchParams.get("search")?.trim() ?? "";

    const where = {
      ...(section && isTaskSection(section) ? { section } : {}),
      ...(status && isTaskStatus(status) ? { status } : {}),
      ...(assignee === "me"
        ? { assignedToId: session.id }
        : assignee === "unassigned"
          ? { assignedToId: null }
          : assignee
            ? { assignedToId: assignee }
            : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, countsByStatus, countsBySection] = await Promise.all([
      prisma.adminTask.findMany({
        where,
        include: taskInclude,
        orderBy: [{ sortOrder: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      }),
      prisma.adminTask.groupBy({
        by: ["status"],
        where: section && isTaskSection(section) ? { section } : {},
        _count: { id: true },
      }),
      prisma.adminTask.groupBy({
        by: ["section"],
        _count: { id: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      countsByStatus.map((row) => [row.status, row._count.id])
    );
    const sectionCounts = Object.fromEntries(
      TASK_SECTIONS.map((s) => [
        s.value,
        countsBySection.find((row) => row.section === s.value)?._count.id ?? 0,
      ])
    );

    return NextResponse.json({
      items: items.map(serializeTask),
      counts: {
        TODO: statusCounts.TODO ?? 0,
        IN_PROGRESS: statusCounts.IN_PROGRESS ?? 0,
        DONE: statusCounts.DONE ?? 0,
        sections: sectionCounts,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tasks:", error);
    return handleAuthError(error, "Failed to load tasks");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const section = normalizeTaskSection(body.section);
    const status = normalizeTaskStatus(body.status);
    const priority = normalizeTaskPriority(body.priority);
    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;
    const dueAt = parseTaskDueAt(body.dueAt);
    const linkUrl = typeof body.linkUrl === "string" ? body.linkUrl.trim() || null : null;
    const linkLabel = typeof body.linkLabel === "string" ? body.linkLabel.trim() || null : null;

    let assignedToId: string | null = null;
    if (typeof body.assignedToId === "string" && body.assignedToId.trim()) {
      const user = await prisma.user.findUnique({
        where: { id: body.assignedToId.trim() },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
      }
      assignedToId = user.id;
    } else if (body.assignToMe === true) {
      assignedToId = session.id;
    }

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
        linkLabel,
        assignedToId,
        createdById: session.id,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        completedAt: status === "DONE" ? new Date() : null,
      },
      include: taskInclude,
    });

    await logAudit("create", "task", `Created task "${task.title}"`, {
      userId: session.id,
      entityId: task.id,
    });

    return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to create task");
  }
}
