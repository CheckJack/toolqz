import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { saveDailyAnalyticsSnapshot } from "@/lib/analytics-snapshot";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await saveDailyAnalyticsSnapshot();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/cron/analytics-snapshot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Snapshot failed" },
      { status: 500 }
    );
  }
}
