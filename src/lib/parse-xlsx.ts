import * as XLSX from "xlsx";
import { AffiliateImportRow } from "@/types/affiliate";

function cellStr(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  return String(v).trim() || undefined;
}

function parseRecurring(v: unknown): string | undefined {
  const s = cellStr(v)?.toLowerCase();
  if (!s) return undefined;
  if (["yes", "y", "true", "1"].includes(s)) return "yes";
  if (["no", "n", "false", "0"].includes(s)) return "no";
  return s;
}

/** Parse first sheet of an Excel workbook into affiliate import rows. */
export function parseAffiliateXlsx(buffer: ArrayBuffer): AffiliateImportRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows.flatMap((row) => {
    const keys = Object.keys(row);
    const find = (...names: string[]) => {
      const key = keys.find((k) =>
        names.some((n) => k.toLowerCase().includes(n.toLowerCase()))
      );
      return key ? row[key] : undefined;
    };

    const companyName = cellStr(find("company", "name"));
    if (!companyName) return [];

    return [
      {
        companyName,
        category: cellStr(find("category")),
        commission: cellStr(find("commission")),
        recurring: parseRecurring(find("recurring")),
        cookieDuration: cellStr(find("cookie")),
        signupUrl: cellStr(find("signup", "url")),
        notes: cellStr(find("notes")),
      },
    ];
  });
}
