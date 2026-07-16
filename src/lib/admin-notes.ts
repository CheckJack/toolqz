import type { AdminNote, AdminNoteAttachment, AdminNoteLink, User } from "@prisma/client";
import { publicUrlForNoteStorage } from "@/lib/note-uploads";

type NoteWithRelations = AdminNote & {
  createdBy: Pick<User, "id" | "name">;
  links: AdminNoteLink[];
  attachments: AdminNoteAttachment[];
};

export function serializeNote(note: NoteWithRelations) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    visibility: note.visibility,
    pinned: note.pinned,
    createdById: note.createdById,
    createdBy: note.createdBy,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    links: note.links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      createdAt: l.createdAt.toISOString(),
    })),
    attachments: note.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      url: publicUrlForNoteStorage(a.storagePath),
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export function canViewNote(
  note: { visibility: string; createdById: string },
  userId: string
): boolean {
  return note.visibility === "SHARED" || note.createdById === userId;
}

export function canEditNote(
  note: { visibility: string; createdById: string },
  userId: string,
  role: string
): boolean {
  if (note.createdById === userId || role === "ADMIN") return true;
  return note.visibility === "SHARED";
}

export function canDeleteNote(
  note: { createdById: string },
  userId: string,
  role: string
): boolean {
  return note.createdById === userId || role === "ADMIN";
}

export const noteInclude = {
  createdBy: { select: { id: true, name: true } },
  links: { orderBy: { createdAt: "asc" as const } },
  attachments: { orderBy: { createdAt: "asc" as const } },
} as const;
