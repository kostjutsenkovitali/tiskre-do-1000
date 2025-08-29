import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext} from "@/i18n/config";
import {GET_PRODUCT} from "@/lib/queries/products";
import {GET_ARTICLE} from "@/lib/queries/blog";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import {sf} from "@/lib/shopify";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

type Props = {
  params: { locale: string; segment: string; slug: string };
};

export default async function DetailBySegment({params}: Props) {
  const {locale: rawLocale, segment, slug} = params;
  if (!isLocale(rawLocale)) notFound();

  const shopSeg = getSegment("shop", rawLocale);
  const blogSeg = getSegment("blog", rawLocale);
  const isShop = segment === shopSeg;
  const isBlog = segment === blogSeg;
  if (!isShop && !isBlog) notFound();

  if (isShop) {
    const {country, language} = resolveInContext(rawLocale);
    const data = await sf<{ product: any }>(GET_PRODUCT, { handle: slug, country, language });
    const p = data.product;
    if (!p) notFound();
    // Map Shopify product to the expected ProductLike shape for the client component
    const firstVariant = p.variants?.nodes?.[0];
    const price = firstVariant ? `${firstVariant.price.amount} ${firstVariant.price.currencyCode}` : "";
    const mainImage = (p.media?.nodes || [])
      .map((m: any) => (m.__typename === "MediaImage" ? m.image : null))
      .filter(Boolean)?.[0] || null;
    const productLike = {
      id: p.id,
      slug: p.handle,
      name: p.title,
      description: p.descriptionHtml,
      sku: firstVariant?.sku,
      stockStatus: firstVariant?.availableForSale ? "IN_STOCK" : "OUT_OF_STOCK",
      image: mainImage ? { sourceUrl: mainImage.url, altText: mainImage.altText } : null,
      price,
      galleryImages: { nodes: (p.media?.nodes || []).map((m: any) => (m.__typename === "MediaImage" ? { sourceUrl: m.image?.url, altText: m.image?.altText } : null)).filter(Boolean) },
    } as any;

    // Reuse the existing client product detail component for visuals
    return (
      <ProductDetailClient product={productLike} related={[]} />
    );
  }

  // blog detail
  const data = await sf<{ blog: { articleByHandle: any } }>(GET_ARTICLE, {
    blogHandle: SHOPIFY_BLOG_HANDLE,
    articleHandle: slug,
  });
  const a = data.blog?.articleByHandle;
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-sm text-muted-foreground">{new Date(a.publishedAt).toLocaleDateString()}</div>
      <h1 className="mb-4 text-3xl font-semibold">{a.title}</h1>
      {a.image ? (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded border border-gray-200">
          <Image src={a.image.url} alt={a.image.altText || a.title} fill className="object-cover" />
        </div>
      ) : null}
      <div
        className="prose dark:prose-invert"
        dangerouslySetInnerHTML={{__html: sanitizeHtml(a.contentHtml, {allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img","iframe"])})}}
      />
    </div>
  );
}


