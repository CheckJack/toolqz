import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import {
  fetchInstagramReport,
  InstagramConfigError,
  type InstagramRange,
} from "@/lib/instagram-server";

const RANGES = new Set<InstagramRange>(["7d", "30d", "90d"]);

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const rawRange = request.nextUrl.searchParams.get("range") ?? "30d";
    const range: InstagramRange = RANGES.has(rawRange as InstagramRange)
      ? (rawRange as InstagramRange)
      : "30d";

    const data = await fetchInstagramReport(range);
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return handleAuthError(error);
    }
    if (error instanceof InstagramConfigError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    const raw = error instanceof Error ? error.message : "Instagram request failed";
    return NextResponse.json({ error: raw }, { status: 502 });
  }
}
