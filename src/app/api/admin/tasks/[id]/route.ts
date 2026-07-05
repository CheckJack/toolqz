import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import {
  normalizeTaskPriority,
  normalizeTaskSection,
  normalizeTaskStatus,
  parseTaskDueAt,
} from "@/lib/admin-tasks";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.adminTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      description?: string | null;
      section?: string;
      status?: string;
      priority?: string;
      dueAt?: Date | null;
      linkUrl?: string | null;
      linkLabel?: string | null;
      assignedToId?: string | null;
      completedAt?: Date | null;
    } = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      data.title = title;
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" ? body.description.trim() || null : null;
    }

    if (body.section !== undefined) {
      data.section = normalizeTaskSection(body.section);
    }

    if (body.priority !== undefined) {
      data.priority = normalizeTaskPriority(body.priority);
    }

    if (body.dueAt !== undefined) {
      data.dueAt = parseTaskDueAt(body.dueAt);
    }

    if (body.linkUrl !== undefined) {
      data.linkUrl = typeof body.linkUrl === "string" ? body.linkUrl.trim() || null : null;
    }

    if (body.linkLabel !== undefined) {
      data.linkLabel = typeof body.linkLabel === "string" ? body.linkLabel.trim() || null : null;
    }

    if (body.assignedToId !== undefined) {
      if (body.assignedToId === null || body.assignedToId === "") {
        data.assignedToId = null;
      } else if (typeof body.assignedToId === "string") {
        const user = await prisma.user.findUnique({
          where: { id: body.assignedToId },
          select: { id: true },
        });
        if (!user) {
          return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
        }
        data.assignedToId = user.id;
      }
    }

    if (body.status !== undefined) {
      const status = normalizeTaskStatus(body.status);
      data.status = status;
      data.completedAt = status === "DONE" ? new Date() : null;
    }

    const task = await prisma.adminTask.update({
      where: { id },
      data,
      include: taskInclude,
    });

    await logAudit("update", "task", `Updated task "${task.title}"`, {
      userId: session.id,
      entityId: task.id,
    });

    return NextResponse.json({ task: serializeTask(task) });
  } catch (error) {
    return handleAuthError(error, "Failed to update task");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const existing = await prisma.adminTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.adminTask.delete({ where: { id } });

    await logAudit("delete", "task", `Deleted task "${existing.title}"`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete task");
  }
}
