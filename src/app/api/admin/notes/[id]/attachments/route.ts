import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditNote, canViewNote, noteInclude, serializeNote } from "@/lib/admin-notes";
import { saveNoteUpload } from "@/lib/note-uploads";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const note = await prisma.adminNote.findUnique({ where: { id } });
    if (!note || !canViewNote(note, session.id)) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (!canEditNote(note, session.id, session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveNoteUpload({
      noteId: id,
      fileName: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
      bytes,
    });

    await prisma.adminNoteAttachment.create({
      data: {
        noteId: id,
        fileName: file.name || "upload",
        mimeType: file.type || "application/octet-stream",
        sizeBytes: saved.sizeBytes,
        storagePath: saved.storagePath,
      },
    });

    const updated = await prisma.adminNote.findUniqueOrThrow({
      where: { id },
      include: noteInclude,
    });
    return NextResponse.json(serializeNote(updated), { status: 201 });
  } catch (error) {
    if (error instanceof Error && /too large|not allowed/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error, "Failed to upload file");
  }
}
