import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext, LOCALES, segments} from "@/i18n/config";
import {GET_PRODUCT, GET_PRODUCTS} from "@/lib/queries/products";
import {GET_ARTICLE, LIST_ARTICLES} from "@/lib/queries/blog";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import {sf} from "@/lib/shopify";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

// Enable static export
export const dynamic = "force-static";

// Remove ISR since it's not compatible with static export
// export const revalidate = 3600;

// Generate static params for popular products and articles
export async function generateStaticParams() {
  const params: Array<{ locale: string; segment: string; slug: string }> = [];
  for (const locale of LOCALES) {
    // Products
    try {
      const { language } = resolveInContext(locale as any);
      const products = await sf<{ products: { nodes: Array<{ handle: string }> } }>(GET_PRODUCTS, {
        first: 50,
        language,
      });
      const productHandles = products?.products?.nodes?.map((n: any) => n.handle).filter(Boolean) || [];
      for (const handle of productHandles) {
        params.push({ locale, segment: segments.shop[locale], slug: handle });
      }
    } catch {}

    // Blog articles
    try {
      const { language } = resolveInContext(locale as any);
      const arts = await sf<{ articles: { nodes: Array<{ handle: string }> } }>(LIST_ARTICLES, {
        first: 30,
        language,
      });
      const articleHandles = arts?.articles?.nodes?.map((a: any) => a.handle).filter(Boolean) || [];
      for (const handle of articleHandles) {
        params.push({ locale, segment: segments.blog[locale], slug: handle });
      }
    } catch {}
  }
  return params;
}

export const dynamicParams = false;

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
    
    try {
      const data = await sf<{ product: any }>(GET_PRODUCT, { handle: slug, country, language });
      const p = data.product;
      if (!p) notFound();
      
      // Map Shopify product to the expected ProductLike shape for the client component
      const firstVariant = p.variants?.nodes?.[0];
      const price = firstVariant ? `${firstVariant.price.amount} ${firstVariant.price.currencyCode}` : "";
      const mainImage = (p.media?.nodes || [])
        .map((m: any) => (m.__typename === "MediaImage" ? m.image : null))
        .filter((im: any) => !!im && typeof im.url === "string")?.[0] || null;
      
      // Extract all media images for the thumbnail carousel
      const mediaImages = (p.media?.nodes || [])
        .map((m: any) => (m.__typename === "MediaImage" ? m.image : null))
        .filter((im: any) => !!im && typeof im.url === "string") || [];
      
      // Extract video URL from media
      const productVideo = (() => {
        const videoNode = (p.media?.nodes || []).find((m: any) => m.__typename === "Video");
        if (videoNode && videoNode.sources && videoNode.sources.length > 0) {
          // Prefer mp4 videos, otherwise use the first available source
          const mp4Source = videoNode.sources.find((s: any) => s.mimeType === "video/mp4");
          return mp4Source ? mp4Source.url : videoNode.sources[0].url;
        }
        return null;
      })();
      
      const bulletPoints: string[] = (() => {
        const mf = p.bulletPoints;
        // Check if mf has a value property (which is typical for metafields)
        if (mf && typeof mf === "object" && "value" in mf) {
          if (typeof mf.value === "string") {
            const points = mf.value.split("\n").filter(Boolean);
            return points;
          }
        }
        if (typeof mf === "string") {
          const points = mf.split("\n").filter(Boolean);
          return points;
        }
        if (Array.isArray(mf)) {
          const points = mf.filter((x: any) => typeof x === "string");
          return points;
        }
        return [];
      })();

      const productLike = {
        id: p.id || p.handle,
        slug: p.handle,
        title: p.title,
        description: p.descriptionHtml || p.description || "",
        price,
        image: mainImage ? { url: mainImage.url, altText: mainImage.altText || p.title } : null,
        // Add media images for thumbnails
        media: { nodes: mediaImages.map((img: any) => ({ image: img })) },
        bulletPoints,
        // Map instruction metafields correctly
        instructionJpg: p.instructionJpg,
        instructionJpgEn: p.instructionJpgEn,
        instructionJpgEe: p.instructionJpgEe,
        instructionJpgFi: p.instructionJpgFi,
        instructionPdf: p.instructionPdf,
        instructionPdfEn: p.instructionPdfEn,
        // Map technical parameters metafield
        technicalParameters: p.technicalParameters,
        // Keep original metafield data for reference
        bulletPointsMetafield: p.bulletPoints,
        instructionJpgMetafield: p.instructionJpg,
        instructionJpgEnMetafield: p.instructionJpgEn,
        instructionJpgEeMetafield: p.instructionJpgEe,
        instructionJpgFiMetafield: p.instructionJpgFi,
        instructionPdfMetafield: p.instructionPdf,
        productVideo: productVideo, // Add product video field
        availableForSale: p.availableForSale ?? true,
        tags: p.tags || [],
        vendor: p.vendor || "",
        variants: p.variants || null,
      };
      
      // Pass both product and locale props to ProductDetailClient
      return <ProductDetailClient locale={rawLocale} product={productLike} related={[]} />;
    } catch (error) {
      // Failed to fetch product, return 404
      notFound();
    }
  }

  // Blog article
  const { language } = resolveInContext(rawLocale);
  
  try {
    const data = await sf<{ article: any }>(GET_ARTICLE, { blogHandle: SHOPIFY_BLOG_HANDLE, articleHandle: slug, language });
    const article = data.article;
    if (!article) notFound();
    
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/${rawLocale}/${segment}/`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          ← Back to Blog
        </Link>

        <article>
          {article.image && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <Image src={article.image.url} alt={article.image.altText || article.title} fill className="object-cover" unoptimized />
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-3xl font-medium text-foreground mb-4">{article.title}</h1>
            <div className="flex items-center text-muted-foreground text-sm">
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              {article.author && (
                <>
                  <span className="mx-2">•</span>
                  <span>By {article.author.firstName} {article.author.lastName}</span>
                </>
              )}
            </div>
          </header>

          <div 
            className="prose prose-neutral max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(article.contentHtml || article.content || "", {
                allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
                allowedAttributes: {
                  'a': ['href', 'target'],
                  'img': ['src', 'alt', 'width', 'height']
                }
              })
            }} 
          />
        </article>
      </div>
    );
  } catch (error) {
    // Failed to fetch article, return 404
    notFound();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {locale: rawLocale, segment, slug} = (await params) as { locale: string; segment: string; slug: string };
  
  if (!isLocale(rawLocale)) {
    return { title: "Not Found" };
  }

  const shopSeg = getSegment("shop", rawLocale);
  const isShop = segment === shopSeg;
  
  try {
    if (isShop) {
      const {country, language} = resolveInContext(rawLocale);
      const data = await sf<{ product: any }>(GET_PRODUCT, { handle: slug, country, language });
      const p = data.product;
      
      if (p) {
        return {
          title: p.title,
          description: p.description || p.title,
        };
      }
    } else {
      const { language } = resolveInContext(rawLocale);
      const data = await sf<{ article: any }>(GET_ARTICLE, { blogHandle: SHOPIFY_BLOG_HANDLE, articleHandle: slug, language });
      const article = data.article;
      
      if (article) {
        return {
          title: article.title,
          description: article.excerpt || article.title,
        };
      }
    }
  } catch (error) {
    // Failed to generate metadata, return default
  }
  
  return { title: "Page Not Found" };
}