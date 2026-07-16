import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
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

  const fallbackDestination = await getToolRedirectUrl(slug);

  if (!fallbackDestination) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const result = await recordClick({
    slug,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ip: getClientIp(request),
    requestUrl: request.url,
  });

  const destination = result.recorded ? result.redirectUrl : fallbackDestination;

  return NextResponse.redirect(destination);
}
