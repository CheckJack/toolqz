import { NextRequest, NextResponse } from "next/server";
import { parseClickRange } from "@/lib/analytics-ranges";
import { fetchOutboundClickAnalytics } from "@/lib/analytics-clicks";
import { handleAuthError } from "@/lib/api-errors";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const range = parseClickRange(request.nextUrl.searchParams.get("range"));
    const mode = request.nextUrl.searchParams.get("mode") ?? "full";
    const toolSlug = request.nextUrl.searchParams.get("tool");

    if (mode === "dashboard") {
      return NextResponse.json(await getDashboardAnalytics(session));
    }

    const data = await fetchOutboundClickAnalytics(range, toolSlug ?? undefined);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[admin/analytics]", error);
    return handleAuthError(error, "Failed to load analytics");
  }
}
