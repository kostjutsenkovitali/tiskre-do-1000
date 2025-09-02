import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, segments, isLocale } from "@/i18n/config";

// Pages that should be redirected to locale-specific versions
const LOCALIZED_PAGES = ['about', 'contact', 'instructions'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Debugging logs
  console.log('Middleware processing:', pathname);
  console.log('LOCALIZED_PAGES:', LOCALIZED_PAGES);
  
  // Redirect root to default locale
  if (pathname === "/" || pathname === "") {
    console.log('Redirecting root to default locale');
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }
  
  // Redirect non-locale paths for known localized pages
  const parts = pathname.split("/").filter(Boolean);
  const [first] = parts;
  
  console.log('First part:', first);
  console.log('Is first part a localized page?', LOCALIZED_PAGES.includes(first));
  console.log('Is first part a locale?', first && isLocale(first));
  
  // If the first part is a known localized page and not a locale, redirect to default locale version
  if (first && LOCALIZED_PAGES.includes(first) && !isLocale(first)) {
    console.log('Redirecting to localized version');
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/${first}`, req.url));
  }

  // Optional: 404 on mismatched localized segments (e.g., /et/shop instead of /et/pood)
  const [maybeLocale, second] = parts;
  if (maybeLocale && isLocale(maybeLocale) && second) {
    const expectedShop = segments.shop[maybeLocale as keyof typeof segments.shop];
    const expectedBlog = segments.blog[maybeLocale as keyof typeof segments.blog];
    const allShop = new Set(Object.values(segments.shop));
    const allBlog = new Set(Object.values(segments.blog));
    const isMismatchedShop = allShop.has(second as any) && second !== expectedShop;
    const isMismatchedBlog = allBlog.has(second as any) && second !== expectedBlog;
    if (isMismatchedShop || isMismatchedBlog) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }
  }
  
  console.log('No redirect needed, continuing');
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/about(.*)",
    "/contact(.*)",
    "/instructions(.*)",
    "/((?!_next|api|static|.*\\.).*)"
  ],
};