import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isLocale, LOCALES } from "@/i18n/config";
import { HeroSection } from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import TestimoniesAbout from "@/components/TestimoniesAbout";
import HexagonWithPosts from "@/components/HexagonWithPosts";
import ScrollDownButton from "@/components/ScrollDownButton";
import SpaRouter from "@/components/SpaRouter";
import { GET_COLLECTIONS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import { resolveInContext } from "@/i18n/config";

type Props = { params: { locale: string } };

// Fetch Shopify collections at build time
async function getShopifyCollections(locale: string) {
  try {
    const { country, language } = resolveInContext(locale as any);
    const data = await sf<{ collections: any }>(GET_COLLECTIONS, { first: 50, language });
    return (data?.collections?.nodes || []).map((c: any) => ({ 
      id: c.id || c.handle, 
      slug: c.handle, 
      name: c.title 
    }));
  } catch (error) {
    console.error("Failed to fetch Shopify collections:", error);
    return [];
  }
}

// Generate static params for all locales with Shopify data
export async function generateStaticParams() {
  // Fetch data for all locales
  const localeData = await Promise.all(
    LOCALES.map(async (locale) => {
      const collections = await getShopifyCollections(locale);
      return {
        locale,
        collections
      };
    })
  );
  
  return localeData.map(({ locale }) => ({
    locale,
  }));
}

// Make it a static page
export const dynamic = "force-static";
// Removed revalidate since it's not compatible with static export
// export const revalidate = 3600; // Revalidate at most every hour

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return notFound();
  
  // Fetch Shopify collections at build time
  const collections = await getShopifyCollections(locale);
  
  return (
    <div className="w-full space-y-0">
      <Suspense fallback={<div />}>
        <SpaRouter collections={collections} />
      </Suspense>
      <Suspense fallback={<div />}>
        <HeroSection categories={collections} />
      </Suspense>
      <PortfolioSection />
      <TestimoniesAbout />
      <HexagonWithPosts locale={locale} />
      <ScrollDownButton scope="home" />
    </div>
  );
}