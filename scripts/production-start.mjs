/**
 * Production start for Hostinger managed Node.js (and Docker).
 */
import { spawnSync } from "node:child_process";
import { normalizeDatabaseUrl } from "./normalize-database-url.mjs";

const rawUrl = process.env.DATABASE_URL ?? "";
const url = normalizeDatabaseUrl(rawUrl);
if (url && url !== rawUrl) {
  process.env.DATABASE_URL = url;
}

const port = process.env.PORT ?? "3000";

function run(cmd, args, { allowFail = false } = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false, env: process.env });
  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1);
  }
  return result.status === 0;
}

console.log("[start] DATABASE_URL set:", Boolean(process.env.DATABASE_URL));
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
  console.error("[start] ERROR: DATABASE_URL is not set. Add it in Hostinger Environment Variables.");
  process.exit(1);
}

if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  const migrated = run("npx", ["prisma", "migrate", "deploy"], { allowFail: true });
  if (!migrated) {
    console.log("[start] migrate deploy failed — falling back to db push");
    run("npx", ["prisma", "db", "push", "--accept-data-loss"]);
  }
} else if (url.startsWith("mysql://")) {
  run("npx", ["prisma", "db", "push", "--accept-data-loss"]);
} else if (url.startsWith("file:")) {
  run("npx", ["prisma", "db", "push", "--skip-generate"]);
}

run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port]);
