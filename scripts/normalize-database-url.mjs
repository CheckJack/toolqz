/**
 * Ensures Postgres URLs work on managed hosts (Supabase, Neon, etc.)
 */
export function normalizeDatabaseUrl(url) {
  if (!url) return url;

  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has("sslmode")) {
        parsed.searchParams.set("sslmode", "require");
      }
      return parsed.toString();
    } catch {
      return url.includes("sslmode=") ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
    }
  }

  return url;
}
