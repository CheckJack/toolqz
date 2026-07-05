/**
 * Mark a failed Prisma migration as rolled back on production Postgres.
 * Usage:
 *   DATABASE_URL='postgresql://...' npm run db:migrate:resolve -- 20260705120000_password_reset_tokens
 */
import { spawnSync } from "node:child_process";
import { setupProductionPrismaEnv } from "./prisma-prod-env.mjs";

const migration = process.argv[2];
if (!migration) {
  console.error(
    "[migrate:resolve] Pass the migration folder name, e.g.\n" +
      "  npm run db:migrate:resolve -- 20260705120000_password_reset_tokens"
  );
  process.exit(1);
}

setupProductionPrismaEnv();

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env, shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node", ["scripts/sync-prisma-provider.mjs"]);
run("npx", ["prisma", "migrate", "resolve", "--rolled-back", migration]);

console.log(`[migrate:resolve] Marked ${migration} as rolled back.`);
