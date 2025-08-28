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
import AddToCartButton from "@/components/AddToCartButton";

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
    const mediaImages = (p.media.nodes || [])
      .map((m: any) => (m.__typename === "MediaImage" ? m.image : null))
      .filter(Boolean) as { url: string; altText?: string | null; width?: number | null; height?: number | null }[];
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden border border-gray-300">
              {mediaImages[0] ? (
                <Image src={mediaImages[0].url} alt={mediaImages[0].altText || p.title} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            {mediaImages.length > 1 ? (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {mediaImages.slice(0, 6).map((img, i) => (
                  <div key={img.url + i} className="relative aspect-square overflow-hidden border border-gray-200">
                    <Image src={img.url} alt={img.altText || p.title} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">{p.title}</h1>
            {p.variants.nodes[0] ? (
              <div className="text-lg">{p.variants.nodes[0].price.amount} {p.variants.nodes[0].price.currencyCode}</div>
            ) : null}
            {p.variants.nodes[0]?.id ? (
              <AddToCartButton variantId={p.variants.nodes[0].id} />
            ) : (
              <p className="text-sm text-red-600">No purchasable variant.</p>
            )}
            <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{__html: p.descriptionHtml}} />
          </div>
        </div>
      </div>
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


