import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeploymentIssues } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = getDeploymentIssues();
  let database = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }

  const healthy = issues.length === 0 && database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      issues: process.env.NODE_ENV === "production" ? issues : issues,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
