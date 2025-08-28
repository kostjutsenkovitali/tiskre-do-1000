import { segments, type Locale, isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export function shopPath(locale: Locale): string {
  return `/${locale}/${segments.shop[locale]}`;
}

export function productPath(locale: Locale, handle: string): string {
  return `/${locale}/${segments.shop[locale]}/${handle}`;
}

export function blogPath(locale: Locale): string {
  return `/${locale}/${segments.blog[locale]}`;
}

export function articlePath(locale: Locale, handle: string): string {
  return `/${locale}/${segments.blog[locale]}/${handle}`;
}

export function detectLocaleFromPath(pathname?: string | null): Locale {
  const fallback = DEFAULT_LOCALE as Locale;
  if (!pathname) return fallback;
  const seg = pathname.split("/").filter(Boolean)[0];
  return isLocale(seg || "") ? (seg as Locale) : fallback;
}


