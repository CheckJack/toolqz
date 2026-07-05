import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
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
