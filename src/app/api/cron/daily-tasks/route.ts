import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runDailyTaskDigest } from "@/lib/task-digest";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyTaskDigest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/cron/daily-tasks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily task digest failed" },
      { status: 500 }
    );
  }
}
