import { prisma } from "@/lib/db";
import { normalizeNoteVisibility } from "@/constants/admin-notes";
import {
  canDeleteNote,
  canEditNote,
  canViewNote,
  noteInclude,
  serializeNote,
} from "@/lib/admin-notes";
import { deleteNoteUploadFile } from "@/lib/note-uploads";
import { assertUniqueMatch } from "./entity-resolve";

async function findNote(args: Record<string, unknown>, userId: string) {
  const id = typeof args.note_id === "string" ? args.note_id.trim() : "";
  const title = typeof args.note_title === "string" ? args.note_title.trim() : "";

  if (id) {
    const note = await prisma.adminNote.findUnique({
      where: { id },
      include: noteInclude,
    });
    if (!note || !canViewNote(note, userId)) return null;
    return note;
  }

  if (title) {
    const rows = await prisma.adminNote.findMany({
      where: {
        AND: [
          { OR: [{ visibility: "SHARED" }, { createdById: userId }] },
          { title: { contains: title } },
        ],
      },
      include: noteInclude,
      take: 10,
    });
    return assertUniqueMatch(rows, title, (r) => r.title, "note");
  }

  return null;
}

export async function listNotesForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const search = typeof args.search === "string" ? args.search.trim() : "";
  const visibility =
    args.visibility === "PRIVATE" || args.visibility === "SHARED"
      ? args.visibility
      : "";
  const limit =
    typeof args.limit === "number" && Number.isFinite(args.limit)
      ? Math.min(Math.max(Math.round(args.limit), 1), 50)
      : 20;

  const notes = await prisma.adminNote.findMany({
    where: {
      AND: [
        { OR: [{ visibility: "SHARED" }, { createdById: userId }] },
        visibility ? { visibility } : {},
        search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
              ],
            }
          : {},
      ],
    },
    include: noteInclude,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return {
    success: true,
    count: notes.length,
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      visibility: n.visibility,
      pinned: n.pinned,
      createdBy: n.createdBy.name,
      updatedAt: n.updatedAt.toISOString(),
      linkCount: n.links.length,
      attachmentCount: n.attachments.length,
    })),
  };
}

export async function createNoteForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  if (!title) throw new Error("create_note requires a title");

  const content =
    typeof args.content === "string"
      ? args.content
      : typeof args.body === "string"
        ? args.body
        : "";
  // Store plain text as simple HTML paragraphs if no tags
  const html =
    content.includes("<") && content.includes(">")
      ? content
      : content
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("") || "<p></p>";

  const visibility = normalizeNoteVisibility(args.visibility);
  const pinned = args.pinned === true;

  const note = await prisma.adminNote.create({
    data: {
      title,
      content: html,
      visibility,
      pinned,
      createdById: userId,
    },
    include: noteInclude,
  });

  const links = Array.isArray(args.links) ? args.links : [];
  for (const item of links) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (!url) continue;
    const label =
      typeof row.label === "string" && row.label.trim() ? row.label.trim() : url;
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      await prisma.adminNoteLink.create({
        data: { noteId: note.id, label, url },
      });
    } catch {
      // skip invalid
    }
  }

  const refreshed = await prisma.adminNote.findUniqueOrThrow({
    where: { id: note.id },
    include: noteInclude,
  });

  return {
    success: true,
    note: serializeNote(refreshed),
  };
}

export async function updateNoteForAgent(
  args: Record<string, unknown>,
  userId: string,
  role: string
) {
  const note = await findNote(args, userId);
  if (!note) throw new Error("Note not found — provide note_id or note_title");
  if (!canEditNote(note, userId, role)) {
    throw new Error("You cannot edit this note");
  }

  const data: {
    title?: string;
    content?: string;
    visibility?: string;
    pinned?: boolean;
  } = {};

  if (typeof args.title === "string" && args.title.trim()) {
    data.title = args.title.trim();
  }
  if (typeof args.content === "string") {
    const content = args.content;
    data.content =
      content.includes("<") && content.includes(">")
        ? content
        : content
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
            .join("") || note.content;
  }
  if (args.visibility === "PRIVATE" || args.visibility === "SHARED") {
    data.visibility = args.visibility;
  }
  if (typeof args.pinned === "boolean") data.pinned = args.pinned;

  const updated = await prisma.adminNote.update({
    where: { id: note.id },
    data,
    include: noteInclude,
  });

  if (typeof args.add_link_url === "string" && args.add_link_url.trim()) {
    const url = args.add_link_url.trim();
    const label =
      typeof args.add_link_label === "string" && args.add_link_label.trim()
        ? args.add_link_label.trim()
        : url;
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      await prisma.adminNoteLink.create({
        data: { noteId: note.id, label, url },
      });
    } catch {
      throw new Error("Invalid add_link_url");
    }
  }

  const refreshed = await prisma.adminNote.findUniqueOrThrow({
    where: { id: note.id },
    include: noteInclude,
  });

  return { success: true, note: serializeNote(refreshed), updated };
}

export async function deleteNoteForAgent(
  args: Record<string, unknown>,
  userId: string,
  role: string
) {
  const note = await findNote(args, userId);
  if (!note) throw new Error("Note not found — provide note_id or note_title");
  if (!canDeleteNote(note, userId, role)) {
    throw new Error("You cannot delete this note");
  }

  for (const att of note.attachments) {
    await deleteNoteUploadFile(att.storagePath);
  }
  await prisma.adminNote.delete({ where: { id: note.id } });
  return { success: true, title: note.title, id: note.id };
}

export async function getNoteForAgent(
  args: Record<string, unknown>,
  userId: string
) {
  const note = await findNote(args, userId);
  if (!note) throw new Error("Note not found — provide note_id or note_title");
  return { success: true, note: serializeNote(note) };
}
