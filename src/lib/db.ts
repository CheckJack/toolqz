import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

// Bump when Prisma schema changes so dev hot-reload picks up a fresh client.
const PRISMA_SCHEMA_VERSION = "2026-07-01-postgres";

function normalizeRuntimeDatabaseUrl(url: string): string {
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    if (parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    if (
      !parsed.searchParams.has("connection_limit") &&
      (parsed.port === "6543" || parsed.hostname.includes("pooler"))
    ) {
      parsed.searchParams.set("connection_limit", "5");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl) {
    const normalized = normalizeRuntimeDatabaseUrl(rawUrl);
    if (normalized !== rawUrl) {
      process.env.DATABASE_URL = normalized;
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

// Reuse one client per Node process in all environments (critical on Supabase).
globalForPrisma.prisma = prisma;
globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
