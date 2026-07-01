export const FINANCE_TYPES = ["EARNING", "EXPENSE"] as const;
export type FinanceType = (typeof FINANCE_TYPES)[number];

export function isFinanceType(value: string): value is FinanceType {
  return FINANCE_TYPES.includes(value as FinanceType);
}

export function parseFinanceAmount(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export const DEFAULT_CURRENCY = "EUR";

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
