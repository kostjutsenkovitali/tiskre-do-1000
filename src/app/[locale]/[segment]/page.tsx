import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext, LOCALES, segments} from "@/i18n/config";
import {GET_PRODUCTS, GET_COLLECTIONS} from "@/lib/queries/products";
import {LIST_ARTICLES, GET_BLOG_WITH_ARTICLES} from "@/lib/queries/blog";
import {sf} from "@/lib/shopify";
import type {GetProductsResponse} from "@/lib/types/shopify";
import ShopClient from "./ShopClient";

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

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

// Generate static params for all locale/segment combinations
export async function generateStaticParams() {
  const params = [];
  
  for (const locale of LOCALES) {
    // Add shop segments
    params.push({
      locale,
      segment: segments.shop[locale],
    });
    
    // Add blog segments
    params.push({
      locale,
      segment: segments.blog[locale],
    });
  }
  
  return params;
}

type Props = {
  params: { locale: string; segment: string };
  searchParams?: { q?: string; after?: string; first?: string; query?: string };
};

export default async function IndexBySegment({params, searchParams}: Props) {
  const { locale: rawLocale, segment } = await params;
  if (!isLocale(rawLocale)) notFound();

  const shopSeg = getSegment("shop", rawLocale);
  const blogSeg = getSegment("blog", rawLocale);
  const isShop = segment === shopSeg;
  const isBlog = segment === blogSeg;
  if (!isShop && !isBlog) notFound();

  if (isShop) {
    const {country, language} = resolveInContext(rawLocale);
    const first = 12;
    const q = (await searchParams)?.q?.trim() || undefined;
    const after = (await searchParams)?.after || undefined;
    
    // Fetch collections at build time
    const collections = await getShopifyCollections(rawLocale);
    
    // For ISR, we'll fetch initial data but allow client-side updates
    try {
      const data = await sf<GetProductsResponse>(GET_PRODUCTS, {
        first,
        after,
        query: q,
        country,
        language,
      });
      
      const products = data.products.nodes.map((n) => ({
        id: n.handle,
        slug: n.handle,
        title: n.title,
        description: "",
        price: n.priceRange.minVariantPrice.amount,
        currencyCode: n.priceRange.minVariantPrice.currencyCode,
        featuredImage: n.featuredImage ? { url: n.featuredImage.url, altText: n.featuredImage.altText || undefined } : null,
        availableForSale: true,
        tags: (n as any).tags || [],
        vendor: (n as any).vendor,
        collections: n.collections?.nodes || [],
      }));
      
      const pageInfo = data.products.pageInfo;
      const basePath = `/${rawLocale}/${segment}`;
      const nextHref = pageInfo.hasNextPage && pageInfo.endCursor
        ? `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), after: pageInfo.endCursor }).toString()}`
        : null;
      const prevHref = after
        ? `${basePath}${q ? `?${new URLSearchParams({ q }).toString()}` : ""}`
        : null;

      return <ShopClient products={products as any} categories={collections} hrefBase={`/${rawLocale}/${segment}`} showCategoryHeader={false} />;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Fallback to client-side rendering
      return <ShopClient products={[]} categories={collections} hrefBase={`/${rawLocale}/${segment}`} showCategoryHeader={false} />;
    }
  }

  // Blog index with ISR
  const first = Number(searchParams?.first || 12);
  const query = searchParams?.query || undefined;
  const { language } = resolveInContext(rawLocale);
  const blogHandle = "news";
  let nodes: any[] = [];
  let blogTitle = "News";
  
  try {
    const data = await sf<{ blog: { title: string; articles: { nodes: any[] } } }>(GET_BLOG_WITH_ARTICLES, { blogHandle, first, language });
    blogTitle = data.blog?.title || blogTitle;
    nodes = data.blog?.articles?.nodes ?? [];
  } catch (err) {
    try {
      const data = await sf<{ articles: { nodes: any[] } }>(LIST_ARTICLES, { first, query, language });
      nodes = data.articles?.nodes ?? [];
    } catch {
      nodes = [];
    }
  }
  
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{blogTitle}</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((a: any) => (
          <Link key={a.handle + a.publishedAt} href={`/${rawLocale}/${segment}/${a.handle}`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded border border-gray-200">
              {a.image ? (
                <Image src={a.image.url} alt={a.image.altText || a.title} fill className="object-cover transition-transform group-hover:scale-[1.03]" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">{a.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{new Date(a.publishedAt).toLocaleDateString()}</p>
              {a.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}