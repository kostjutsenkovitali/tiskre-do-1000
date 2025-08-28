import { DEFAULT_LOCALE, segments, type Locale, isLocale } from "@/i18n/config";

// Map old WP-style paths to new localized routes. Extend as needed.
// Example: '/shop/' -> '/en/shop' (or '/et/pood' for Estonian), etc.
const COMMON_OLD_PATHS = [
  "/shop",
  "/blog",
  "/category",
  "/product",
  "/news",
];

export function mapOldPathToLocalized(pathname: string, preferredLocale?: Locale): string | null {
  const locale: Locale = preferredLocale && isLocale(preferredLocale) ? preferredLocale : DEFAULT_LOCALE;
  if (!pathname || pathname === "/") return `/${locale}`;
  const cleaned = pathname.replace(/\/$/, "");
  // Very simple examples; customize patterns if needed
  if (cleaned === "/shop") return `/${locale}/${segments.shop[locale]}`;
  if (cleaned.startsWith("/product/")) {
    const handle = cleaned.split("/")[2];
    return `/${locale}/${segments.shop[locale]}/${handle}`;
  }
  if (cleaned === "/blog" || cleaned === "/news") return `/${locale}/${segments.blog[locale]}`;
  if (cleaned.startsWith("/blog/")) {
    const handle = cleaned.split("/")[2];
    return `/${locale}/${segments.blog[locale]}/${handle}`;
  }
  return null;
}

export function buildRedirects(preferredLocale?: Locale): Array<{ source: string; destination: string; permanent: boolean }>{
  const locale: Locale = preferredLocale && isLocale(preferredLocale) ? preferredLocale : DEFAULT_LOCALE;
  return [
    { source: "/shop", destination: `/${locale}/${segments.shop[locale]}`, permanent: true },
    { source: "/blog", destination: `/${locale}/${segments.blog[locale]}`, permanent: true },
    { source: "/news", destination: `/${locale}/${segments.blog[locale]}`, permanent: true },
    // simple catch-alls can be added per pattern if desired
  ];
}


