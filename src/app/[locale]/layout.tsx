import {notFound} from "next/navigation";
import {createContext} from "react";
import {isLocale, resolveInContext} from "@/i18n/config";
import type {CountryCode, LanguageCode, Locale} from "@/i18n/config";

export const LanguageContext = createContext<{ country: CountryCode; language: LanguageCode } | null>(null);

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default function LocaleLayout({children, params}: Props) {
  const raw = params.locale;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  const ctx = resolveInContext(locale);
  return <LanguageContext.Provider value={ctx}>{children}</LanguageContext.Provider>;
}


