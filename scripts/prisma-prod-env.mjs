/**
 * Normalize DATABASE_URL / DIRECT_URL for production Postgres (Supabase).
 */
import { normalizeDatabaseUrl, resolveMigrationUrl } from "./normalize-database-url.mjs";

export function setupProductionPrismaEnv() {
  const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error(
      "[db] Set DATABASE_URL to your Supabase Postgres URI, e.g.\n" +
        "  DATABASE_URL='postgresql://postgres:...@db....supabase.co:5432/postgres' npm run db:migrate:prod"
    );
    process.exit(1);
  }

  process.env.DATABASE_URL = url;
  if (!process.env.DIRECT_URL?.trim()) {
    process.env.DIRECT_URL = resolveMigrationUrl() || url;
  }

  return url;
}
