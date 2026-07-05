import {
  isTaskPriority,
  isTaskSection,
  isTaskStatus,
  type TaskPriority,
  type TaskSection,
  type TaskStatus,
} from "@/constants/admin-tasks";

export function parseTaskDueAt(value: unknown): Date | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function normalizeTaskSection(value: unknown): TaskSection {
  const raw = typeof value === "string" ? value.trim() : "";
  return isTaskSection(raw) ? raw : "general";
}

export function normalizeTaskStatus(value: unknown): TaskStatus {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  return isTaskStatus(raw) ? raw : "TODO";
}

export function normalizeTaskPriority(value: unknown): TaskPriority {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  return isTaskPriority(raw) ? raw : "MEDIUM";
}

export function isTaskOverdue(dueAt: string | null | undefined, status: string): boolean {
  if (!dueAt || status === "DONE") return false;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}
