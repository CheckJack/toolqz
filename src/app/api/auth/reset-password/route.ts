import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken, validatePasswordResetToken } from "@/lib/password-reset";
import { isPasswordLongEnough, passwordTooShortMessage } from "@/lib/password-policy";
import { enforceRateLimit } from "@/lib/rate-limit";

const RESET_LIMIT = 10;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const profile = await validatePasswordResetToken(token);
  if (!profile) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({ valid: true, email: profile.email, name: profile.name });
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "auth-reset-password", RESET_LIMIT, RESET_WINDOW_MS);
  if (limited) return limited;

  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token.trim()) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (!isPasswordLongEnough(password)) {
      return NextResponse.json({ error: passwordTooShortMessage() }, { status: 400 });
    }

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/reset-password:", error);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
