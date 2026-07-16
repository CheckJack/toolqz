import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditNote, canViewNote, noteInclude, serializeNote } from "@/lib/admin-notes";

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

    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim()
        : url;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    await prisma.adminNoteLink.create({
      data: { noteId: id, label, url },
    });

    const updated = await prisma.adminNote.findUniqueOrThrow({
      where: { id },
      include: noteInclude,
    });
    return NextResponse.json(serializeNote(updated), { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to add link");
  }
}
