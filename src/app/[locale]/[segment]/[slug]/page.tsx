import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext} from "@/i18n/config";
import {GET_PRODUCT, GET_COLLECTION_PRODUCTS} from "@/lib/queries/products";
import {GET_ARTICLE} from "@/lib/queries/blog";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import {sf} from "@/lib/shopify";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

type Props = {
  params: any;
};

export default async function DetailBySegment({params}: Props) {
  const {locale: rawLocale, segment, slug} = (await params) as { locale: string; segment: string; slug: string };
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
      .filter((im: any) => !!im && typeof im.url === "string")?.[0] || null;
    const bulletPoints: string[] = (() => {
      const mf = p.bulletPoints;
      if (!mf?.value) return [];
      try {
        // Shopify text metafield may be JSON (list) or newline-separated text
        const parsed = JSON.parse(mf.value);
        if (Array.isArray(parsed)) return parsed.filter((x: any) => typeof x === "string");
      } catch {}
      return String(mf.value)
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    })();

    // Build related products (from first collection), exclude current, limit 4
    let related: any[] = [];
    const firstCollectionHandle = p.collections?.nodes?.[0]?.handle;
    if (firstCollectionHandle) {
      try {
        const rel = await sf<{ collection: any }>(GET_COLLECTION_PRODUCTS, { handle: firstCollectionHandle, first: 8, country, language });
        const nodes = rel.collection?.products?.nodes || [];
        related = nodes
          .filter((n: any) => n.handle !== p.handle)
          .slice(0, 4)
          .map((n: any) => ({
            id: n.id,
            slug: n.handle,
            name: n.title,
            image: n.featuredImage ? { sourceUrl: n.featuredImage.url, altText: n.featuredImage.altText } : null,
            price: n.priceRange?.minVariantPrice ? `${n.priceRange.minVariantPrice.amount} ${n.priceRange.minVariantPrice.currencyCode}` : "",
          }));
      } catch {}
    }

    // Build gallery images array with only absolute URLs
    const galleryNodes = (p.media?.nodes || [])
      .map((m: any) => (m.__typename === "MediaImage" ? { sourceUrl: m.image?.url, altText: m.image?.altText } : null))
      .filter((n: any) => !!n && typeof n.sourceUrl === "string" && /^https?:\/\//i.test(n.sourceUrl));

    const productLike = {
      id: p.id,
      slug: p.handle,
      name: p.title,
      description: p.descriptionHtml,
      sku: firstVariant?.sku,
      stockStatus: firstVariant?.availableForSale ? "IN_STOCK" : "OUT_OF_STOCK",
      image: mainImage && /^https?:\/\//i.test(mainImage.url) ? { sourceUrl: mainImage.url, altText: mainImage.altText } : null,
      price,
      galleryImages: { nodes: galleryNodes },
      bulletPoints,
      instructionJpg: (() => {
        const refUrl = p.instructionJpg?.reference?.image?.url || p.instructionJpg?.reference?.url || null;
        if (refUrl && /^https?:\/\//i.test(refUrl)) return refUrl;
        const list = p.instructionJpg?.references?.nodes || [];
        const first = list.find((n: any) => n?.image?.url || n?.url);
        const u = first?.image?.url || first?.url || p.instructionJpg?.value || null;
        return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
      })(),
      instructionPdf: (() => {
        const refUrl = p.instructionPdf?.reference?.url || null;
        if (refUrl && /^https?:\/\//i.test(refUrl)) return refUrl;
        const list = p.instructionPdf?.references?.nodes || [];
        const first = list.find((n: any) => n?.url);
        const u = first?.url || p.instructionPdf?.value || null;
        return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
      })(),
    } as any;

    // Reuse the existing client product detail component for visuals
    return (
      <ProductDetailClient locale={rawLocale} product={productLike} related={related} />
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


