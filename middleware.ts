import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, segments, isLocale } from "@/i18n/config";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }

  // Optional: 404 on mismatched localized segments (e.g., /et/shop instead of /et/pood)
  const parts = pathname.split("/").filter(Boolean);
  const [maybeLocale, first] = parts;
  if (maybeLocale && isLocale(maybeLocale) && first) {
    const expectedShop = segments.shop[maybeLocale];
    const expectedBlog = segments.blog[maybeLocale];
    const allShop = new Set(Object.values(segments.shop));
    const allBlog = new Set(Object.values(segments.blog));
    const isMismatchedShop = allShop.has(first) && first !== expectedShop;
    const isMismatchedBlog = allBlog.has(first) && first !== expectedBlog;
    if (isMismatchedShop || isMismatchedBlog) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\.).*)"],
};


