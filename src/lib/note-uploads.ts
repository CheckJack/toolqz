import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  NOTE_ALLOWED_MIME_PREFIXES,
  NOTE_MAX_UPLOAD_BYTES,
} from "@/constants/admin-notes";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "notes");

export function isAllowedNoteMime(mimeType: string): boolean {
  return NOTE_ALLOWED_MIME_PREFIXES.some(
    (prefix) => mimeType === prefix || mimeType.startsWith(prefix)
  );
}

export function publicUrlForNoteStorage(storagePath: string): string {
  return `/${storagePath.replace(/^\/+/, "")}`;
}

export async function saveNoteUpload(input: {
  noteId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ storagePath: string; sizeBytes: number }> {
  if (input.bytes.length > NOTE_MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${NOTE_MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`);
  }
  if (!isAllowedNoteMime(input.mimeType)) {
    throw new Error("File type not allowed");
  }

  const safeBase = input.fileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const unique = `${Date.now()}-${randomBytes(4).toString("hex")}-${safeBase || "file"}`;
  const dir = path.join(UPLOAD_ROOT, input.noteId);
  await mkdir(dir, { recursive: true });
  const abs = path.join(dir, unique);
  await writeFile(abs, input.bytes);

  const storagePath = path.join("uploads", "notes", input.noteId, unique).replace(/\\/g, "/");
  return { storagePath, sizeBytes: input.bytes.length };
}

export async function deleteNoteUploadFile(storagePath: string): Promise<void> {
  const abs = path.join(process.cwd(), "public", storagePath);
  if (!abs.startsWith(path.join(process.cwd(), "public", "uploads", "notes"))) {
    return;
  }
  try {
    await unlink(abs);
  } catch {
    // ignore missing file
  }
}
