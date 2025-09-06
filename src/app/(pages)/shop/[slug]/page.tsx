import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/shop/ProductDetailClient";
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import { resolveInContext, DEFAULT_LOCALE } from "@/i18n/config";
import type { GetProductsResponse } from "@/lib/types/shopify";
import { detectLocaleFromPath } from "@/lib/paths";

// Make this page statically generated
export const dynamic = 'force-static';

type Props = { params: { slug: string } };

export default async function ProductDetailPage({ params }: Props) {
  const handle = params.slug;
  const data = await sf<{ product: any }>(GET_PRODUCT, { handle });
  const p = data.product;
  if (!p) return notFound();
  
  // Get locale from the request context
  const locale = detectLocaleFromPath(params.slug) || DEFAULT_LOCALE;
  
  return <ProductDetailClient locale={locale} product={p} />;
}

export async function generateStaticParams() {
  try {
    const { country, language } = resolveInContext(DEFAULT_LOCALE);
    const data = await sf<GetProductsResponse>(GET_PRODUCTS, {
      first: 50,
      country,
      language,
    });
    const handles = data?.products?.nodes?.map((n: any) => n.handle).filter(Boolean) || [];
    return handles.map((slug: string) => ({ slug }));
  } catch {
    return [] as Array<{ slug: string }>;
  }
}

export const dynamicParams = false;