import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { getGa4Diagnostics } from "@/lib/ga4-server";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json(getGa4Diagnostics());
  } catch (error) {
    return handleAuthError(error, "Failed to check GA4 config");
  }
}
