import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePlaybookCategory } from "@/constants/admin-playbook";

const snippetInclude = {
  createdBy: { select: { id: true, name: true } },
} as const;

function serializeSnippet(snippet: {
  id: string;
  question: string;
  answer: string;
  category: string;
  aliases: string | null;
  tags: string | null;
  pinned: boolean;
  sortOrder: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string } | null;
}) {
  return {
    ...snippet,
    createdAt: snippet.createdAt.toISOString(),
    updatedAt: snippet.updatedAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.adminPlaybookSnippet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      question?: string;
      answer?: string;
      category?: string;
      aliases?: string | null;
      tags?: string | null;
      pinned?: boolean;
      sortOrder?: number;
    } = {};

    if (body.question !== undefined) {
      const question = typeof body.question === "string" ? body.question.trim() : "";
      if (!question) {
        return NextResponse.json({ error: "Question is required" }, { status: 400 });
      }
      data.question = question;
    }

    if (body.answer !== undefined) {
      const answer = typeof body.answer === "string" ? body.answer.trim() : "";
      if (!answer) {
        return NextResponse.json({ error: "Answer is required" }, { status: 400 });
      }
      data.answer = answer;
    }

    if (body.category !== undefined) {
      data.category = normalizePlaybookCategory(body.category);
    }

    if (body.aliases !== undefined) {
      data.aliases = typeof body.aliases === "string" ? body.aliases.trim() || null : null;
    }

    if (body.tags !== undefined) {
      data.tags = typeof body.tags === "string" ? body.tags.trim() || null : null;
    }

    if (body.pinned !== undefined) {
      data.pinned = Boolean(body.pinned);
    }

    if (body.sortOrder !== undefined && typeof body.sortOrder === "number") {
      data.sortOrder = body.sortOrder;
    }

    const snippet = await prisma.adminPlaybookSnippet.update({
      where: { id },
      data,
      include: snippetInclude,
    });

    await logAudit("update", "playbook", `Updated playbook snippet "${snippet.question}"`, {
      userId: session.id,
      entityId: snippet.id,
    });

    return NextResponse.json({ snippet: serializeSnippet(snippet) });
  } catch (error) {
    return handleAuthError(error, "Failed to update snippet");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const existing = await prisma.adminPlaybookSnippet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    await prisma.adminPlaybookSnippet.delete({ where: { id } });

    await logAudit("delete", "playbook", `Deleted playbook snippet "${existing.question}"`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete snippet");
  }
}
