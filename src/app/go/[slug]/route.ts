import { NextRequest, NextResponse } from "next/server";
import { getCanonicalToolSlug, getToolRedirectUrl, recordClick } from "@/lib/tools";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const canonicalSlug = await getCanonicalToolSlug(slug);

  if (!canonicalSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (canonicalSlug !== slug) {
    return NextResponse.redirect(new URL(`/go/${canonicalSlug}`, request.url), 308);
  }

  const destination = await getToolRedirectUrl(slug);

  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await recordClick(slug, {
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.redirect(destination);
}
