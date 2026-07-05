/**
 * Run Prisma migrations against production Postgres (Supabase).
 * Usage:
 *   DATABASE_URL='postgresql://...' npm run db:migrate:prod
 */
import { spawnSync } from "node:child_process";
import { normalizeDatabaseUrl, resolveMigrationUrl } from "./normalize-database-url.mjs";

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error(
    "[migrate] Set DATABASE_URL to your Supabase Postgres URI, e.g.\n" +
      "  DATABASE_URL='postgresql://postgres:...@db....supabase.co:5432/postgres' npm run db:migrate:prod"
  );
  process.exit(1);
}

process.env.DATABASE_URL = url;
if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = resolveMigrationUrl() || url;
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env, shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node", ["scripts/sync-prisma-provider.mjs"]);
run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"]);

console.log("[migrate] Done.");
