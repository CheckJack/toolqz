import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { fetchAnalyticsOverview } from "@/lib/analytics-overview";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const range = request.nextUrl.searchParams.get("range") ?? "30d";
    const data = await fetchAnalyticsOverview(range);
    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error, "Failed to load analytics overview");
  }
}
