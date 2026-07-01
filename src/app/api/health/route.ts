import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeploymentIssues } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = getDeploymentIssues();
  let database = "unknown";
  let databaseError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (error) {
    database = "error";
    databaseError =
      error instanceof Error ? error.message.split("\n")[0] : "Connection failed";
  }

  const healthy = issues.length === 0 && database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      databaseError,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      issues,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
