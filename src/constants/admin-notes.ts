export const NOTE_VISIBILITY = ["PRIVATE", "SHARED"] as const;
export type NoteVisibility = (typeof NOTE_VISIBILITY)[number];

export function isNoteVisibility(value: unknown): value is NoteVisibility {
  return typeof value === "string" && NOTE_VISIBILITY.includes(value as NoteVisibility);
}

export function normalizeNoteVisibility(value: unknown): NoteVisibility {
  return isNoteVisibility(value) ? value : "PRIVATE";
}

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  PRIVATE: "Private (only you)",
  SHARED: "Shared with team",
};

/** Max attachment size: 10MB */
export const NOTE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const NOTE_ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "text/",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/zip",
] as const;
