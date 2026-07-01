/**
 * Production start for Hostinger managed Node.js (and Docker).
 * Runs migrations when DATABASE_URL is PostgreSQL/MySQL; uses db push for SQLite.
 */
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
const port = process.env.PORT ?? "3000";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/sync-prisma-provider.mjs"]);
run("npx", ["prisma", "generate"]);

if (url.startsWith("postgresql://") || url.startsWith("postgres://") || url.startsWith("mysql://")) {
  run("npx", ["prisma", "migrate", "deploy"]);
} else if (url.startsWith("file:")) {
  run("npx", ["prisma", "db", "push", "--skip-generate"]);
}

run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port]);
