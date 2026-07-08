import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { notifyAnalyticsWarnings } from "@/lib/analytics-notifications";
import { requireSession } from "@/lib/auth";
import { fetchGa4SiteReport, Ga4ConfigError, type Ga4Range } from "@/lib/ga4-server";

const RANGES = new Set<Ga4Range>(["7d", "30d", "90d", "all"]);

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const rawRange = request.nextUrl.searchParams.get("range") ?? "30d";
    const range: Ga4Range = RANGES.has(rawRange as Ga4Range) ? (rawRange as Ga4Range) : "30d";

    const data = await fetchGa4SiteReport(range);
    void notifyAnalyticsWarnings(data.warnings, "traffic");
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return handleAuthError(error);
    }
    if (error instanceof Ga4ConfigError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    const raw = error instanceof Error ? error.message : "GA4 request failed";
    const friendly = raw.includes("PEM routines") || raw.includes("no start line")
      ? "GA4 private key is malformed on the server. Set GA4_CREDENTIALS_JSON (one-line JSON) in Hostinger env vars and redeploy. Remove GA4_PRIVATE_KEY if present."
      : raw;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
