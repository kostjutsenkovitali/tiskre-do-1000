import { notFound } from "next/navigation";
import { isLocale, getSegment, resolveInContext, LOCALES, segments } from "@/i18n/config";
import { GET_COLLECTION_PRODUCTS, GET_COLLECTIONS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import ShopClient from "../../ShopClient";

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate static params for all locales/segments and Shopify collections
export async function generateStaticParams() {
  const allParams: Array<{ locale: string; segment: string; category: string }> = [];
  for (const locale of LOCALES) {
    const shopSeg = segments.shop[locale];
    try {
      const { language } = resolveInContext(locale as any);
      const data = await sf<{ collections: { nodes: Array<{ handle: string }> } }>(GET_COLLECTIONS, {
        first: 50,
        language,
      });
      const nodes = data?.collections?.nodes ?? [];
      for (const c of nodes) {
        if (c?.handle) {
          allParams.push({ locale, segment: shopSeg, category: c.handle });
        }
      }
    } catch {
      // Ignore fetch errors at build time for static export
    }
  }
  return allParams;
}

// Required for static export: no runtime dynamic params
export const dynamicParams = false;

type Props = {
  params: { locale: string; segment: string; category: string };
};

export default async function CategoryPage({ params }: Props) {
  const { locale: rawLocale, segment, category } = await params;
  if (!isLocale(rawLocale)) notFound();

  const shopSeg = getSegment("shop", rawLocale);
  const isShop = segment === shopSeg;
  if (!isShop) notFound();

  const { country, language } = resolveInContext(rawLocale);
  
  try {
    // Fetch products for this specific category
    const data = await sf<any>(GET_COLLECTION_PRODUCTS, {
      handle: category,
      country,
      language,
    });
    
    // Check if collection exists
    if (!data.collection) {
      notFound();
    }
    
    const products = data.collection.products.nodes.map((n: any) => ({
      id: n.handle,
      slug: n.handle,
      title: n.title,
      description: "",
      price: n.priceRange.minVariantPrice.amount,
      currencyCode: n.priceRange.minVariantPrice.currencyCode,
      featuredImage: n.featuredImage ? { url: n.featuredImage.url, altText: n.featuredImage.altText || undefined } : null,
      availableForSale: true,
      tags: [],
      vendor: "",
      // Add collections array with the current category to support filtering
      collections: {
        nodes: [{ handle: category, title: category }]
      }
    }));
    
    // Fetch all collections to populate the sidebar
    const collectionsData = await sf<{ collections: any }>(GET_COLLECTIONS, { first: 50 });
    
    const collections = (collectionsData?.collections?.nodes || []).map((c: any) => ({ 
      id: c.id || c.handle, 
      slug: c.handle, 
      name: c.title 
    }));
    
    // Show category header only for smokers category
    const showCategoryHeader = category === "smokers";
    
    return (
      <ShopClient 
        products={products as any} 
        categories={collections} 
        hrefBase={`/${rawLocale}/${segment}`} 
        selectedCategory={category} 
        showCategoryHeader={showCategoryHeader}
      />
    );
  } catch (error) {
    console.error('Failed to fetch category products:', error);
    notFound();
  }
}