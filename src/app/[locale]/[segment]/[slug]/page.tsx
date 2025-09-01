import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext, LOCALES, segments} from "@/i18n/config";
import {GET_PRODUCT, GET_COLLECTION_PRODUCTS} from "@/lib/queries/products";
import {GET_ARTICLE} from "@/lib/queries/blog";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import {sf} from "@/lib/shopify";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

// Enable ISR with 1 hour revalidation for product pages
export const revalidate = 3600;

// Generate static params for popular products and articles
export async function generateStaticParams() {
  const params = [];
  
  // For now, return empty array - products will be generated on-demand via ISR
  // In a real app, you'd fetch popular products/articles here
  
  // Example of how to pre-generate popular items:
  // const popularProducts = await getPopularProducts();
  // for (const locale of LOCALES) {
  //   for (const product of popularProducts) {
  //     params.push({
  //       locale,
  //       segment: segments.shop[locale],
  //       slug: product.handle,
  //     });
  //   }
  // }
  
  return params;
}

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
      
      const bulletPoints: string[] = (() => {
        const mf = p.bulletPoints;
        if (typeof mf === "string") return mf.split("\n").filter(Boolean);
        if (Array.isArray(mf)) return mf.filter((x: any) => typeof x === "string");
        return [];
      })();
      
      const productLike = {
        id: p.handle,
        slug: p.handle,
        title: p.title,
        description: p.description || "",
        price,
        image: mainImage ? { url: mainImage.url, altText: mainImage.altText || p.title } : null,
        bulletPoints,
        availableForSale: p.availableForSale ?? true,
        tags: p.tags || [],
        vendor: p.vendor || "",
      };
      
      return <ProductDetailClient product={productLike} />;
    } catch (error) {
      console.error('Failed to fetch product:', error);
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
              <Image src={article.image.url} alt={article.image.altText || article.title} fill className="object-cover" />
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
    console.error('Failed to fetch article:', error);
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
    console.error('Failed to generate metadata:', error);
  }
  
  return { title: "Page Not Found" };
}