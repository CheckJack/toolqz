import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runFollowUpReminders } from "@/lib/follow-up-reminders";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFollowUpReminders();
  return NextResponse.json({
    ...result,
    membersNotified: result.digestItems > 0 ? result.emailsSent : 0,
  });
}
