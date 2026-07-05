import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  ADMIN_SIGN_IN_PATH,
  isAdminAuthPath,
  resolveLegacyAuthRedirect,
} from "@/lib/auth-routes";

const SESSION_COOKIE = "toolqz_session";
const AUTH_PAGE_HEADER = "x-toolqz-auth-page";

const ADMIN_NO_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Surrogate-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};

function applyAdminNoCache(response: NextResponse) {
  for (const [key, value] of Object.entries(ADMIN_NO_CACHE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isValidSession(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const legacyTarget = resolveLegacyAuthRedirect(pathname);
  if (legacyTarget) {
    return applyAdminNoCache(NextResponse.redirect(new URL(legacyTarget, request.url)));
  }

  if (pathname === "/admin/login") {
    return applyAdminNoCache(NextResponse.redirect(new URL(ADMIN_SIGN_IN_PATH, request.url)));
  }

  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/sign-in") &&
    pathname !== "/admin/reset-password"
  ) {
    if (!token || !(await isValidSession(token))) {
      const res = NextResponse.redirect(new URL(ADMIN_SIGN_IN_PATH, request.url));
      res.cookies.delete(SESSION_COOKIE);
      return applyAdminNoCache(res);
    }
  }

  if (pathname === ADMIN_SIGN_IN_PATH && token && (await isValidSession(token))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/admin") || isAdminAuthPath(pathname)) {
    applyAdminNoCache(response);
  }
  if (isAdminAuthPath(pathname) || pathname === ADMIN_SIGN_IN_PATH) {
    response.headers.set(AUTH_PAGE_HEADER, "1");
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/forgot-password"],
};
