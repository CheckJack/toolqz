/**
 * Production start for Hostinger managed Node.js (and Docker).
 */
import { spawnSync } from "node:child_process";
import { normalizeDatabaseUrl, resolveMigrationUrl } from "./normalize-database-url.mjs";

const rawUrl = process.env.DATABASE_URL ?? "";
const url = normalizeDatabaseUrl(rawUrl);
if (url && url !== rawUrl) {
  process.env.DATABASE_URL = url;
}

const port = process.env.PORT ?? "3000";

function run(cmd, args, { allowFail = false, env = process.env } = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false, env });
  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1);
  }
  return result.status === 0;
}

console.log("[start] DATABASE_URL set:", Boolean(process.env.DATABASE_URL));
console.log("[start] DIRECT_URL set:", Boolean(process.env.DIRECT_URL));
console.log(
  "[start] provider:",
  url.startsWith("mysql://")
    ? "mysql"
    : url.startsWith("postgresql://") || url.startsWith("postgres://")
      ? "postgresql"
      : url.startsWith("file:")
        ? "sqlite"
        : "unknown"
);

run("node", ["scripts/sync-prisma-provider.mjs"]);
run("npx", ["prisma", "generate"]);

if (!url) {
  console.error(
    "[start] WARNING: DATABASE_URL is not set — app will start but database routes will fail."
  );
} else if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  const migrationUrl = resolveMigrationUrl();
  const migrateEnv = { ...process.env, DATABASE_URL: migrationUrl };

  console.log("[start] Running migrations against direct/session connection…");
  const migrated = run("npx", ["prisma", "migrate", "deploy"], {
    allowFail: true,
    env: migrateEnv,
  });

  if (!migrated) {
    console.log("[start] migrate deploy failed — trying db push");
    run("npx", ["prisma", "db", "push", "--accept-data-loss"], {
      allowFail: true,
      env: migrateEnv,
    });
  }
} else if (url.startsWith("mysql://")) {
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], { allowFail: true });
} else if (url.startsWith("file:")) {
  run("npx", ["prisma", "db", "push", "--skip-generate"], { allowFail: true });
}

console.log(`[start] Starting Next.js on port ${port}`);
run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port]);
