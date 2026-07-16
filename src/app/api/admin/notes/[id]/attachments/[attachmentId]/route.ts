import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditNote, canViewNote, noteInclude, serializeNote } from "@/lib/admin-notes";
import { deleteNoteUploadFile } from "@/lib/note-uploads";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id, attachmentId } = await params;
    const note = await prisma.adminNote.findUnique({ where: { id } });
    if (!note || !canViewNote(note, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (!canEditNote(note, session.id, session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachment = await prisma.adminNoteAttachment.findFirst({
      where: { id: attachmentId, noteId: id },
    });
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    await deleteNoteUploadFile(attachment.storagePath);
    await prisma.adminNoteAttachment.delete({ where: { id: attachmentId } });

    const updated = await prisma.adminNote.findUniqueOrThrow({
      where: { id },
      include: noteInclude,
    });
    return NextResponse.json(serializeNote(updated));
  } catch (error) {
    return handleAuthError(error, "Failed to remove attachment");
  }
}
