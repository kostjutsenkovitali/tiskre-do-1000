export const LOCALES = ["en", "et", "de", "fi", "sv", "fr"] as const;

export type Locale = typeof LOCALES[number];

export const DEFAULT_LOCALE: Locale = "en";

export const segments = {
  shop: {
    en: "shop",
    et: "pood",
    de: "shop-de",
    fi: "kauppa",
    sv: "butik",
    fr: "boutique",
  },
  blog: {
    en: "blog",
    et: "blogi",
    de: "blog",
    fi: "blogi",
    sv: "blogg",
    fr: "blog",
  },
} as const satisfies Record<"shop" | "blog", Record<Locale, string>>;

export const languageToCountry = {
  en: "EE",
  et: "EE",
  de: "DE",
  fi: "FI",
  sv: "SE",
  fr: "FR",
} as const satisfies Record<Locale, string>;

export type CountryCode = (typeof languageToCountry)[Locale];

export const languageToShopify = {
  en: "EN",
  et: "ET",
  de: "DE",
  fi: "FI",
  sv: "SV",
  fr: "FR",
} as const satisfies Record<Locale, string>;

export type LanguageCode = (typeof languageToShopify)[Locale];

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

export function getSegment(kind: "shop" | "blog", locale: Locale): string {
  return segments[kind][locale];
}

export function resolveInContext(locale: Locale): { country: CountryCode; language: LanguageCode } {
  return {
    country: languageToCountry[locale],
    language: languageToShopify[locale],
  };
}


