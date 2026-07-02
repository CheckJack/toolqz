/**
 * Picks Prisma provider from DATABASE_URL so local SQLite and production
 * PostgreSQL/MySQL (Hostinger + Supabase) share one schema file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveMigrationUrl } from "./normalize-database-url.mjs";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const url = process.env.DATABASE_URL ?? "";

let provider = "sqlite";
if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  provider = "postgresql";
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = resolveMigrationUrl() || url;
  }
} else if (url.startsWith("mysql://")) {
  provider = "mysql";
}

let schema = readFileSync(schemaPath, "utf8");
schema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql|mysql)"/,
  `provider = "${provider}"`
);

if (provider === "postgresql") {
  if (!schema.includes("directUrl")) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      `url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")`
    );
  }
} else {
  schema = schema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/, "");
}

writeFileSync(schemaPath, schema);
console.log(`[prisma] datasource provider -> ${provider}`);
