import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIP, isChinaIP } from "@/lib/geo";

// Default locale for visitors who haven't picked one; read by LocaleProvider.
const GEO_LOCALE_COOKIE = "geo-locale";

const PROTECTED = ["/dashboard/positions", "/dashboard/trades"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  if (!request.cookies.has(GEO_LOCALE_COOKIE)) {
    const ip = clientIP(request.headers);
    response.cookies.set(GEO_LOCALE_COOKIE, ip && isChinaIP(ip) ? "zh" : "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
