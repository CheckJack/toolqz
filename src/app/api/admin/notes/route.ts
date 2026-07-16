import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeNoteVisibility } from "@/constants/admin-notes";
import { noteInclude, serializeNote } from "@/lib/admin-notes";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const visibility = searchParams.get("visibility")?.trim() ?? "";
    const mine = searchParams.get("mine") === "1";

    const notes = await prisma.adminNote.findMany({
      where: {
        AND: [
          {
            OR: [{ visibility: "SHARED" }, { createdById: session.id }],
          },
          mine ? { createdById: session.id } : {},
          visibility === "PRIVATE" || visibility === "SHARED"
            ? { visibility }
            : {},
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { content: { contains: q } },
                ],
              }
            : {},
        ],
      },
      include: noteInclude,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      items: notes.map(serializeNote),
      total: notes.length,
    });
  } catch (error) {
    return handleAuthError(error, "Failed to load notes");
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

    const content = typeof body.content === "string" ? body.content : "";
    const visibility = normalizeNoteVisibility(body.visibility);
    const pinned = body.pinned === true;

    const note = await prisma.adminNote.create({
      data: {
        title,
        content,
        visibility,
        pinned,
        createdById: session.id,
      },
      include: noteInclude,
    });

    await logAudit("create", "admin_note", `Created note "${note.title}"`, {
      userId: session.id,
      entityId: note.id,
    });

    return NextResponse.json(serializeNote(note), { status: 201 });
  } catch (error) {
    return handleAuthError(error, "Failed to create note");
  }
}
