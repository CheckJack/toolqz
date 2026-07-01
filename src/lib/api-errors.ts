import { NextResponse } from "next/server";

export function handleAuthError(error: unknown, fallback = "Request failed") {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
