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
    const message = error instanceof Error ? error.message : "Daily task digest failed";
    const needsMigration =
      message.includes("emailTaskDigest") ||
      message.includes("AdminTask") ||
      message.includes("does not exist");
    return NextResponse.json(
      {
        error: message,
        hint: needsMigration
          ? "Run database migrations on production (npm run db:migrate:prod)."
          : undefined,
      },
      { status: 500 }
    );
  }
}
