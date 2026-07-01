/**
 * Picks Prisma provider from DATABASE_URL so local SQLite and production
 * PostgreSQL/MySQL (Hostinger + Supabase) share one schema file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const url = process.env.DATABASE_URL ?? "";

let provider = "sqlite";
if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  provider = "postgresql";
} else if (url.startsWith("mysql://")) {
  provider = "mysql";
}

let schema = readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql|mysql)"/,
  `provider = "${provider}"`
);

if (next !== schema) {
  writeFileSync(schemaPath, next);
  console.log(`[prisma] datasource provider -> ${provider}`);
}
