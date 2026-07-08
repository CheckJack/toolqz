import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import {
  fetchFacebookReport,
  FacebookConfigError,
  type FacebookRange,
} from "@/lib/facebook-server";

const RANGES = new Set<FacebookRange>(["7d", "30d", "90d"]);

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const rawRange = request.nextUrl.searchParams.get("range") ?? "30d";
    const range: FacebookRange = RANGES.has(rawRange as FacebookRange)
      ? (rawRange as FacebookRange)
      : "30d";

    const data = await fetchFacebookReport(range);
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return handleAuthError(error);
    }
    if (error instanceof FacebookConfigError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    const raw = error instanceof Error ? error.message : "Facebook request failed";
    return NextResponse.json({ error: raw }, { status: 502 });
  }
}
