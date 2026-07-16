import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditNote, canViewNote, noteInclude, serializeNote } from "@/lib/admin-notes";

type Params = { params: Promise<{ id: string; linkId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id, linkId } = await params;
    const note = await prisma.adminNote.findUnique({ where: { id } });
    if (!note || !canViewNote(note, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (!canEditNote(note, session.id, session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const link = await prisma.adminNoteLink.findFirst({
      where: { id: linkId, noteId: id },
    });
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.adminNoteLink.delete({ where: { id: linkId } });

    const updated = await prisma.adminNote.findUniqueOrThrow({
      where: { id },
      include: noteInclude,
    });
    return NextResponse.json(serializeNote(updated));
  } catch (error) {
    return handleAuthError(error, "Failed to remove link");
  }
}
