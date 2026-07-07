import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";
import { enforceRateLimit } from "@/lib/rate-limit";

const FORGOT_LIMIT = 5;
const FORGOT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "auth-forgot-password", FORGOT_LIMIT, FORGOT_WINDOW_MS);
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";

    if (!email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await requestPasswordReset(email);

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, we've sent a link to reset your password.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
