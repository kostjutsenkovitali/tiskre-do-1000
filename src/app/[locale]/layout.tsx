import {notFound} from "next/navigation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CartDrawer from "@/components/CartDrawer";
import {isLocale, resolveInContext} from "@/i18n/config";
import type {CountryCode, LanguageCode, Locale} from "@/i18n/config";

// Context is provided by a client provider to avoid client hook usage in a server layout.

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({children, params}: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  const ctx = resolveInContext(locale);
  return (
    <LanguageProvider value={ctx}>
      {children}
      <CartDrawer />
    </LanguageProvider>
  );
}


