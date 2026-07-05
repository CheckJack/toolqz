import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "toolqz_session";

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

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && pathname !== "/admin/reset-password") {
    if (!token || !(await isValidSession(token))) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
  }

  if (pathname === "/admin/login" && token && (await isValidSession(token))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/admin")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
