/**
 * Ensures Postgres URLs work on managed hosts (Supabase, Neon, etc.)
 */
export function normalizeDatabaseUrl(url) {
  if (!url) return url;

  if (url.includes("xxxxx") || url.includes("YOUR_PASSWORD") || url.includes("[YOUR")) {
    console.warn(
      "[db] DATABASE_URL looks like a placeholder — replace it in Hostinger env vars with your real Supabase URI"
    );
  }

  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has("sslmode")) {
        parsed.searchParams.set("sslmode", "require");
      }
      // Prisma + Supabase: transaction pooler (6543) needs pgbouncer flag
      if (parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      return parsed.toString();
    } catch {
      return url.includes("sslmode=") ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
    }
  }

  return url;
}

/**
 * For Prisma migrations, prefer DIRECT_URL (Supabase session/direct port 5432).
 */
export function resolveMigrationUrl() {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return normalizeDatabaseUrl(direct);

  const pooled = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
  if (!pooled) return pooled;

  try {
    const parsed = new URL(pooled);
    // If only pooler URL is provided, try session port on same host
    if (parsed.port === "6543") {
      parsed.port = "5432";
      parsed.searchParams.delete("pgbouncer");
      return parsed.toString();
    }
  } catch {
    // keep pooled url
  }

  return pooled;
}
