import { notFound } from "next/navigation";
import { isLocale, getSegment, resolveInContext, LOCALES, segments } from "@/i18n/config";
import { GET_COLLECTION_PRODUCTS, GET_COLLECTIONS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import ShopClient from "../../ShopClient";

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate static params for popular categories
export async function generateStaticParams() {
  const params: any[] = [];
  
  // For now, return empty array - category pages will be generated on-demand via ISR
  return params;
}

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
    
    return (
      <ShopClient 
        products={products as any} 
        categories={collections} 
        hrefBase={`/${rawLocale}/${segment}`} 
        selectedCategory={category} 
      />
    );
  } catch (error) {
    console.error('Failed to fetch category products:', error);
    notFound();
  }
}