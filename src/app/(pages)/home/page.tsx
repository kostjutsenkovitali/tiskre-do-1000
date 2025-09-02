// app/(pages)/home/page.tsx

import { HeroSection } from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection"; // COMBINED (Portfolio + Popular)
import TestimoniesAbout from "@/components/TestimoniesAbout";
import HexagonWithPosts from "@/components/HexagonWithPosts";
import { getProductCategories } from "@/lib/wpData";
import { GET_COLLECTIONS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import { resolveInContext } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";

// Fetch Shopify collections at build time
async function getShopifyCollections() {
  try {
    const { country, language } = resolveInContext(DEFAULT_LOCALE);
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

// Static generation for home page
export async function generateStaticParams() {
  return [{}]; // Generate one static version
}

// Make it a static page with revalidation
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate at most every hour

export default async function HomeCmsPage() {
  const categories = await getProductCategories();
  const collections = await getShopifyCollections();

  return (
    <div className="w-full space-y-0">
      {/* 1) Hero */}
      <HeroSection categories={collections} />

      {/* 2) Combined: Portfolio (ends at Blue=100%) → Popular (gather + zoom) */}
      <PortfolioSection />

      {/* 3) Next stages */}
      <TestimoniesAbout />

      {/* 4) Hexagon section with localized posts */}
      <HexagonWithPosts locale={DEFAULT_LOCALE} />
    </div>
  );
}