import { NextRequest, NextResponse } from "next/server";
import { runBuildMonitor } from "@/lib/build-monitor";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBuildMonitor();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/cron/build-monitor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Build monitor failed" },
      { status: 500 }
    );
  }
}
