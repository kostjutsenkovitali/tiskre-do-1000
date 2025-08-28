import { NextResponse, type NextRequest } from "next/server";
import { LOCALES } from "@/i18n/config";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "") {
    const locale = LOCALES[0] || "en";
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\.).*)"],
};


