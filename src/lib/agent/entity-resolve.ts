/** Pick one row when the user query matches multiple entities. */
export function assertUniqueMatch<T>(
  rows: T[],
  query: string,
  label: (row: T) => string,
  entityName: string
): T | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];

  const normalized = query.trim().toLowerCase();
  const exact = rows.filter((row) => label(row).trim().toLowerCase() === normalized);
  if (exact.length === 1) return exact[0];

  const names = rows
    .slice(0, 5)
    .map((row) => label(row))
    .join('"; "');
  const suffix = rows.length > 5 ? ` (+${rows.length - 5} more)` : "";
  throw new Error(
    `Multiple ${entityName}s match "${query}": "${names}"${suffix}. Ask the user which one before continuing.`
  );
}
