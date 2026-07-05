export const PLAYBOOK_CATEGORIES = [
  { value: "affiliate_forms", label: "Affiliate forms" },
  { value: "email", label: "Email & messages" },
  { value: "company_info", label: "Company info" },
  { value: "legal", label: "Legal & address" },
  { value: "social", label: "Social & bios" },
  { value: "other", label: "Other" },
] as const;

export type PlaybookCategory = (typeof PLAYBOOK_CATEGORIES)[number]["value"];

export const PLAYBOOK_CATEGORY_LABELS = Object.fromEntries(
  PLAYBOOK_CATEGORIES.map((c) => [c.value, c.label])
) as Record<PlaybookCategory, string>;

export function isPlaybookCategory(value: string): value is PlaybookCategory {
  return PLAYBOOK_CATEGORIES.some((c) => c.value === value);
}

export function normalizePlaybookCategory(value: unknown): PlaybookCategory {
  const raw = typeof value === "string" ? value.trim() : "";
  return isPlaybookCategory(raw) ? raw : "other";
}
