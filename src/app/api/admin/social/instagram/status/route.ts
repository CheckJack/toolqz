import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { getInstagramDiagnostics } from "@/lib/instagram-server";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json(getInstagramDiagnostics());
  } catch (error) {
    return handleAuthError(error, "Failed to check Instagram config");
  }
}
