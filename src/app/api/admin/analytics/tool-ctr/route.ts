import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { parseClickRange, parseTrafficRange } from "@/lib/analytics-ranges";
import { fetchToolCtrReport } from "@/lib/analytics-tool-ctr";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const trafficRange = parseTrafficRange(request.nextUrl.searchParams.get("trafficRange"));
    const clickRange = parseClickRange(request.nextUrl.searchParams.get("clickRange"));
    const data = await fetchToolCtrReport(trafficRange, clickRange);
    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error, "Failed to load tool CTR report");
  }
}
