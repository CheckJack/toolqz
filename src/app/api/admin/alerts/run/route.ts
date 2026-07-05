import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { runBuildMonitor } from "@/lib/build-monitor";
import { runFollowUpReminders } from "@/lib/follow-up-reminders";
import { runDailyTaskDigest } from "@/lib/task-digest";
import { runUptimeCheck } from "@/lib/uptime-monitor";

export const dynamic = "force-dynamic";

const ACTIONS = ["daily-tasks", "build-monitor", "uptime-check", "follow-ups"] as const;
type AlertAction = (typeof ACTIONS)[number];

function isAlertAction(value: unknown): value is AlertAction {
  return typeof value === "string" && ACTIONS.includes(value as AlertAction);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const force = Boolean(body?.force);

    if (!isAlertAction(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    switch (action) {
      case "daily-tasks":
        return NextResponse.json(await runDailyTaskDigest());
      case "build-monitor":
        return NextResponse.json(await runBuildMonitor({ force }));
      case "uptime-check":
        return NextResponse.json(await runUptimeCheck({ force }));
      case "follow-ups":
        return NextResponse.json(await runFollowUpReminders());
    }
  } catch (error) {
    console.error("POST /api/admin/alerts/run:", error);
    return handleAuthError(error, "Alert run failed");
  }
}
