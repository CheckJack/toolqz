import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { fetchGa4SiteReport, type Ga4Range } from "@/lib/ga4-server";

const RANGES = new Set<Ga4Range>(["7d", "30d", "90d", "all"]);

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const rawRange = request.nextUrl.searchParams.get("range") ?? "30d";
    const range: Ga4Range = RANGES.has(rawRange as Ga4Range) ? (rawRange as Ga4Range) : "30d";

    const data = await fetchGa4SiteReport(range);
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return handleAuthError(error);
    }
    const message = error instanceof Error ? error.message : "GA4 request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
