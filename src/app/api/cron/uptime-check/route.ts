import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runUptimeCheck } from "@/lib/uptime-monitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runUptimeCheck();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/cron/uptime-check:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Uptime check failed" },
      { status: 500 }
    );
  }
}
