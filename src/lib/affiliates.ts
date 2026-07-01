import { AffiliateImportRow, AffiliateSeedInput } from "@/types/affiliate";

export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupeKey(companyName: string, signupUrl?: string | null): string {
  const url = signupUrl?.trim().toLowerCase() || "";
  return `${normalizeCompanyName(companyName)}::${url}`;
}

export function parseRecurring(value?: string): boolean | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "recurring"].some((x) => v.includes(x))) return true;
  if (["no", "n", "false", "one-time", "one time"].some((x) => v.includes(x)))
    return false;
  return null;
}

export function serializeAffiliate(row: AffiliateImportRow): AffiliateSeedInput {
  return {
    companyName: row.companyName.trim(),
    category: row.category?.trim(),
    commission: row.commission?.trim(),
    isRecurring: parseRecurring(row.recurring),
    cookieDuration: row.cookieDuration?.trim(),
    signupUrl: row.signupUrl?.trim(),
    website: row.website?.trim(),
    notes: row.notes?.trim(),
    source: "import",
  };
}

export function dedupeAffiliateInputs(
  items: AffiliateSeedInput[]
): AffiliateSeedInput[] {
  const seen = new Set<string>();
  const result: AffiliateSeedInput[] = [];

  for (const item of items) {
    const key = dedupeKey(item.companyName, item.signupUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function affiliateToCsvRow(a: Record<string, unknown>): string[] {
  return [
    String(a.companyName ?? ""),
    String(a.category ?? ""),
    String(a.commission ?? ""),
    a.isRecurring === true ? "Yes" : a.isRecurring === false ? "No" : "",
    String(a.cookieDuration ?? ""),
    String(a.signupUrl ?? ""),
    String(a.website ?? ""),
    String(a.status ?? ""),
    String(a.priority ?? ""),
    String(a.affiliateNetwork ?? ""),
    String(a.notes ?? ""),
    String(a.contactEmail ?? ""),
    String(a.rejectionReason ?? ""),
    String(a.applicationId ?? ""),
    String(a.affiliateUrl ?? ""),
    a.contactedAt ? new Date(String(a.contactedAt)).toISOString() : "",
    a.nextFollowUpAt ? new Date(String(a.nextFollowUpAt)).toISOString() : "",
    a.appliedAt ? new Date(String(a.appliedAt)).toISOString() : "",
    a.approvedAt ? new Date(String(a.approvedAt)).toISOString() : "",
    a.assignedTo && typeof a.assignedTo === "object" && "name" in a.assignedTo
      ? String((a.assignedTo as { name: string }).name)
      : "",
    a.tool && typeof a.tool === "object" && "name" in a.tool
      ? String((a.tool as { name: string }).name)
      : "",
  ];
}

export const CSV_HEADERS = [
  "Company Name",
  "Category",
  "Commission",
  "Recurring?",
  "Cookie Duration",
  "Signup URL",
  "Website",
  "Status",
  "Priority",
  "Affiliate Network",
  "Notes",
  "Contact Email",
  "Rejection Reason",
  "Application ID",
  "Affiliate URL",
  "Contacted At",
  "Next Follow-up",
  "Applied At",
  "Approved At",
  "Assignee",
  "Linked Tool",
];

export function toCsv(rows: string[][]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export function isFollowUpOverdue(nextFollowUpAt?: string | Date | null): boolean {
  if (!nextFollowUpAt) return false;
  return new Date(nextFollowUpAt) < new Date();
}

export function isFollowUpDueThisWeek(
  nextFollowUpAt?: string | Date | null
): boolean {
  if (!nextFollowUpAt) return false;
  const due = new Date(nextFollowUpAt);
  const now = new Date();
  const week = new Date();
  week.setDate(now.getDate() + 7);
  return due >= now && due <= week;
}
