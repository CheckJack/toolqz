/**
 * Run Prisma migrations against production Postgres (Supabase).
 * Usage:
 *   DATABASE_URL='postgresql://...' npm run db:migrate:prod
 */
import { spawnSync } from "node:child_process";
import { setupProductionPrismaEnv } from "./prisma-prod-env.mjs";

setupProductionPrismaEnv();

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env, shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node", ["scripts/sync-prisma-provider.mjs"]);
run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"]);

console.log("[migrate] Done.");
