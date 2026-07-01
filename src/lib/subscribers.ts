import { SubscriberImportRow, SubscriberStatus } from "@/types/subscriber";

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function parseSubscriberStatus(status?: string): SubscriberStatus {
  const v = status?.trim().toUpperCase();
  if (v === "UNSUBSCRIBED" || v === "INACTIVE") return "UNSUBSCRIBED";
  return "ACTIVE";
}

export function subscriberToCsvRow(s: {
  email: string;
  name: string | null;
  status: string;
  source: string;
  subscribedAt: Date | string;
  unsubscribedAt: Date | string | null;
}): string[] {
  return [
    s.email,
    s.name ?? "",
    s.status,
    s.source,
    new Date(s.subscribedAt).toISOString(),
    s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : "",
  ];
}

export const SUBSCRIBER_CSV_HEADERS = [
  "Email",
  "Name",
  "Status",
  "Source",
  "Subscribed At",
  "Unsubscribed At",
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

export function parseSubscriberImportRow(
  headers: string[],
  cols: string[]
): SubscriberImportRow | null {
  const idx = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const iEmail = idx(["email", "e-mail"]);
  const iName = idx(["name", "first"]);
  const iStatus = idx(["status"]);
  const iSource = idx(["source"]);

  const email = (iEmail >= 0 ? cols[iEmail] : cols[0])?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return null;

  return {
    email,
    name: (iName >= 0 ? cols[iName] : cols[1])?.trim() || undefined,
    status: iStatus >= 0 ? cols[iStatus]?.trim() : undefined,
    source: iSource >= 0 ? cols[iSource]?.trim() : undefined,
  };
}
