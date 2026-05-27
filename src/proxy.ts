/**
 * Next.js 16 proxy (renamed from middleware.js).
 *
 * Runs before every matched route. Gates the app behind a single password by
 * checking the signed session cookie. Without a valid cookie, redirects to
 * /login and preserves the intended URL in ?next=…
 *
 * Allowed without a cookie:
 *   - GET /login
 *   - POST/DELETE /api/auth (the cookie-issuing endpoint)
 *   - Static assets (excluded by the matcher below)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET ?? "";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret.length > 0 && (await verifySession(token, secret))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") {
    url.searchParams.set("next", pathname + search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)",
  ],
};
