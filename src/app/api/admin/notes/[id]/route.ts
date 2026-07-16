import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isNoteVisibility } from "@/constants/admin-notes";
import {
  canDeleteNote,
  canEditNote,
  canViewNote,
  noteInclude,
  serializeNote,
} from "@/lib/admin-notes";
import { deleteNoteUploadFile } from "@/lib/note-uploads";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const note = await prisma.adminNote.findUnique({
      where: { id },
      include: noteInclude,
    });
    if (!note || !canViewNote(note, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(serializeNote(note));
  } catch (error) {
    return handleAuthError(error, "Failed to load note");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.adminNote.findUnique({ where: { id } });
    if (!existing || !canViewNote(existing, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (!canEditNote(existing, session.id, session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      content?: string;
      visibility?: string;
      pinned?: boolean;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      data.title = title;
    }
    if (typeof body.content === "string") data.content = body.content;
    if (isNoteVisibility(body.visibility)) data.visibility = body.visibility;
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;

    const note = await prisma.adminNote.update({
      where: { id },
      data,
      include: noteInclude,
    });

    await logAudit("update", "admin_note", `Updated note "${note.title}"`, {
      userId: session.id,
      entityId: note.id,
    });

    return NextResponse.json(serializeNote(note));
  } catch (error) {
    return handleAuthError(error, "Failed to update note");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.adminNote.findUnique({
      where: { id },
      include: { attachments: true },
    });
    if (!existing || !canViewNote(existing, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (!canDeleteNote(existing, session.id, session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    for (const att of existing.attachments) {
      await deleteNoteUploadFile(att.storagePath);
    }

    await prisma.adminNote.delete({ where: { id } });
    await logAudit("delete", "admin_note", `Deleted note "${existing.title}"`, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error, "Failed to delete note");
  }
}
