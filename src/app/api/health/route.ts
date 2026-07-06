import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeploymentIssues } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = getDeploymentIssues();
  let database = "unknown";
  let databaseError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    // Catches pending migrations (e.g. missing User columns) that SELECT 1 alone would miss.
    await prisma.user.findFirst({
      select: {
        id: true,
        emailBuildAlerts: true,
        emailTaskDigest: true,
        emailMessageAlerts: true,
      },
    });
    database = "ok";
  } catch (error) {
    database = "error";
    const message = error instanceof Error ? error.message : "Connection failed";
    databaseError = message.replace(/\s+/g, " ").trim().slice(0, 300);
  }

  const healthy = issues.length === 0 && database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      databaseError,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      emailConfigured: isEmailConfigured(),
      issues,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
