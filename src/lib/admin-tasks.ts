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

export const AFFILIATE_SIGNUP_TASK_TITLE_PREFIX = "Sign up for the affiliate program of ";

export function isAffiliateSignupTask(task: {
  title: string;
  section: string;
  affiliateProgramId?: string | null;
}): boolean {
  return (
    task.section === "affiliates" &&
    (!!task.affiliateProgramId || task.title.startsWith(AFFILIATE_SIGNUP_TASK_TITLE_PREFIX))
  );
}

export function resolveAffiliateProgramId(task: {
  affiliateProgramId?: string | null;
  linkUrl?: string | null;
}): string | null {
  if (task.affiliateProgramId) return task.affiliateProgramId;
  const match = task.linkUrl?.match(/^\/admin\/affiliates\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function extractAffiliateSignupCompanyName(title: string): string | null {
  if (!title.startsWith(AFFILIATE_SIGNUP_TASK_TITLE_PREFIX)) return null;
  const name = title.slice(AFFILIATE_SIGNUP_TASK_TITLE_PREFIX.length).trim();
  return name || null;
}

export function pickAffiliateProgramId(
  programs: { id: string; companyName: string; assignedToId: string | null }[],
  companyName: string,
  assignedToId?: string | null
): string | null {
  const normalized = companyName.trim().toLowerCase();
  const exact = programs.filter((p) => p.companyName.trim().toLowerCase() === normalized);
  if (exact.length === 0) return null;
  if (exact.length === 1) return exact[0].id;
  if (assignedToId) {
    const byAssignee = exact.find((p) => p.assignedToId === assignedToId);
    if (byAssignee) return byAssignee.id;
  }
  return exact[0].id;
}

export type AffiliateSignupOutcomeStatus = "ACTIVE" | "APPLIED" | "REJECTED" | "NOT_AVAILABLE";

export const AFFILIATE_SIGNUP_OUTCOME_STATUSES: {
  value: AffiliateSignupOutcomeStatus;
  label: string;
}[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "APPLIED", label: "Applied" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NOT_AVAILABLE", label: "Not available" },
];
