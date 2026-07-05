export const TASK_SECTIONS = [
  { value: "general", label: "General" },
  { value: "content", label: "Content" },
  { value: "affiliates", label: "Affiliates" },
  { value: "catalog", label: "Catalog" },
  { value: "ops", label: "Operations" },
] as const;

export type TaskSection = (typeof TASK_SECTIONS)[number]["value"];

export const TASK_STATUSES = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

export const TASK_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export const TASK_SECTION_LABELS = Object.fromEntries(
  TASK_SECTIONS.map((s) => [s.value, s.label])
) as Record<TaskSection, string>;

export function isTaskSection(value: string): value is TaskSection {
  return TASK_SECTIONS.some((s) => s.value === value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((s) => s.value === value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.some((s) => s.value === value);
}
