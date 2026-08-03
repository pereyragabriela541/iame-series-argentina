import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.bsproyect.com";
const PRODUCTION_VERCEL_HOST = "iame-series-argentina.vercel.app";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host === PRODUCTION_VERCEL_HOST || host === "bsproyect.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
};
