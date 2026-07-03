import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { getDeploymentIssues } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/db";
import {
  findWebsite,
  getBuildLogs,
  getHostingerDomain,
  HostingerConfigError,
  isHostingerConfigured,
  listBuilds,
  pingPublicSite,
} from "@/lib/hostinger-api";

async function getAppHealth() {
  const issues = getDeploymentIssues();
  let database = "unknown";
  let databaseError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (error) {
    database = "error";
    databaseError =
      error instanceof Error
        ? error.message.replace(/\s+/g, " ").trim().slice(0, 300)
        : "Connection failed";
  }

  return {
    status: issues.length === 0 && database === "ok" ? "ok" : "degraded",
    database,
    databaseError,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    emailConfigured: isEmailConfigured(),
    issues,
  };
}

function getLinks(domain: string) {
  return {
    hpanel: "https://hpanel.hostinger.com/",
    site: process.env.NEXT_PUBLIC_APP_URL ?? `https://${domain}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const logsUuid = request.nextUrl.searchParams.get("logs");
    if (logsUuid) {
      if (!isHostingerConfigured()) {
        return NextResponse.json(
          { error: "HOSTINGER_API_TOKEN is not configured on the server." },
          { status: 503 }
        );
      }
      const logs = await getBuildLogs(logsUuid);
      return NextResponse.json({ uuid: logsUuid, logs });
    }

    const domain = getHostingerDomain();
    const [health, sitePing] = await Promise.all([getAppHealth(), pingPublicSite()]);

    if (!isHostingerConfigured()) {
      return NextResponse.json({
        configured: false,
        domain,
        sitePing,
        health,
        website: null,
        builds: [],
        latestBuild: null,
        hint: "Add HOSTINGER_API_TOKEN to server environment variables to load deploy data.",
        links: getLinks(domain),
      });
    }

    const [website, builds] = await Promise.all([findWebsite(domain), listBuilds(domain, 20)]);

    return NextResponse.json({
      configured: true,
      domain,
      sitePing,
      health,
      website,
      builds,
      latestBuild: builds[0] ?? null,
      links: getLinks(domain),
    });
  } catch (error) {
    if (error instanceof HostingerConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return handleAuthError(error);
    }
    const message = error instanceof Error ? error.message : "Failed to load hosting data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
