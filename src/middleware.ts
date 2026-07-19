import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/leads/:path*",
    "/api/showings/:path*",
    "/api/crm/:path*",
    "/api/open-houses/:path*",
    "/api/transactions/:path*",
    "/api/properties/:path*",
    "/api/ai/:path*",
    "/api/contracts/:path*",
    "/api/email/:path*",
    "/api/social/:path*",
    "/api/automation/:path*",
    "/api/integrations/:path*",
    "/api/import/:path*",
    "/api/org/:path*",
  ],
};
