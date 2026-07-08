import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { getFacebookDiagnostics } from "@/lib/facebook-server";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json(getFacebookDiagnostics());
  } catch (error) {
    return handleAuthError(error, "Failed to check Facebook config");
  }
}
