import { notFound } from "next/navigation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { I18nProvider, type Messages } from "@/contexts/I18nProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { isLocale, resolveInContext, LOCALES, type Locale } from "@/i18n/config";

// Context is provided by a client provider to avoid client hook usage in a server layout.

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};


export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  const ctx = resolveInContext(locale);
  // Dynamically load messages for the current locale (never hardcode English)
  let messages: Messages = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    messages = (await import(`@/messages/${locale}.json`)).default as Messages;
  } catch {
    try {
      messages = (await import("@/messages/en.json")).default as Messages;
    } catch {}
  }
  return (
    <LanguageProvider value={ctx}>
      <I18nProvider locale={locale} messages={messages}>
        <Header />
        {children}
        <Footer />
        <CartDrawer />
      </I18nProvider>
    </LanguageProvider>
  );
}

export async function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l }));
}


