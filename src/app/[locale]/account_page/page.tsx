// Localized alias for Estonian account route: /et/account_page
import Account from "@/app/(pages)/account/page";

// This page needs to be statically generated
export const dynamic = 'force-static';

// Generate static params for all locales
export async function generateStaticParams() {
  // Import locales directly to avoid using headers
  const locales = ["en", "et", "de", "fi", "sv", "fr"];
  
  return locales.map((locale) => ({
    locale,
  }));
}

export default function LocalizedAccountEtPage() {
  return <Account />;
}