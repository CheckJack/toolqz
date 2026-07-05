import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleAuthError(error: unknown, fallback = "Request failed") {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return handleApiError(error, fallback);
}

/** Maps Prisma/unknown errors to JSON responses (logs server-side). */
export function handleApiError(error: unknown, fallback = "Request failed") {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      const table =
        typeof error.meta?.table === "string" ? error.meta.table : "a required";
      return NextResponse.json(
        {
          error: `Database is missing the ${table} table. Run \`npm run db:migrate:prod\` from your Mac with Supabase DATABASE_URL and DIRECT_URL.`,
        },
        { status: 503 }
      );
    }
    if (error.code === "P2022") {
      const column =
        typeof error.meta?.column === "string" ? error.meta.column : "a required column";
      return NextResponse.json(
        {
          error: `Database schema is out of date (missing ${column}). Run \`npm run db:migrate:prod\` from your Mac with Supabase DATABASE_URL and DIRECT_URL.`,
        },
        { status: 503 }
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A record with this value already exists." }, { status: 409 });
    }
  }

  console.error(`[api] ${fallback}:`, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
