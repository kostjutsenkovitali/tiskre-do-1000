import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext, DEFAULT_LOCALE} from "@/i18n/config";
import {GET_PRODUCTS} from "@/lib/queries/products";
import {LIST_ARTICLES, GET_BLOG_WITH_ARTICLES} from "@/lib/queries/blog";
import {sf} from "@/lib/shopify";
import type {GetProductsResponse} from "@/lib/types/shopify";
import ShopClient from "./ShopClient";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";

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
      collections: (n as any).collections?.nodes || [],
    }));
    const pageInfo = data.products.pageInfo;
    const basePath = `/${rawLocale}/${segment}`;
    const nextHref = pageInfo.hasNextPage && pageInfo.endCursor
      ? `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), after: pageInfo.endCursor }).toString()}`
      : null;
    const prevHref = after
      ? `${basePath}${q ? `?${new URLSearchParams({ q }).toString()}` : ""}`
      : null;

    // Build category list from product collections
    const colMap = new Map<string, { id: string; slug: string; name: string }>();
    for (const p of products as any[]) {
      for (const c of (p.collections || [])) {
        const slug = c.handle;
        if (!colMap.has(slug)) colMap.set(slug, { id: c.handle, slug, name: c.title });
      }
    }
    const collections: Array<{ id: string; slug: string; name: string }> = Array.from(colMap.values());
    return <ShopClient products={products as any} collections={collections} hrefBase={`/${rawLocale}/${segment}`} />;
  }

  // Blog index
  const first = 4; // show latest 4
  const query = searchParams?.query || undefined;
  const { language, country } = resolveInContext(rawLocale);
  const { language: defaultLanguage, country: defaultCountry } = resolveInContext(DEFAULT_LOCALE);
  const blogHandle = SHOPIFY_BLOG_HANDLE;
  let nodes: any[] = [];
  const titleByLocale: Record<string, string> = {
    en: "News",
    et: "Uudised",
    fi: "Uutiset",
    sv: "Nyheter",
    de: "Neuigkeiten",
    fr: "Actualités",
  };
  const noArticlesByLocale: Record<string, string> = {
    en: "No articles yet.",
    et: "Artikleid veel ei ole.",
    fi: "Ei artikkeleita vielä.",
    sv: "Inga artiklar ännu.",
    de: "Noch keine Artikel.",
    fr: "Pas encore d’articles.",
  };
  const readMoreByLocale: Record<string, string> = {
    en: "Read more →",
    et: "Loe edasi →",
    fi: "Lue lisää →",
    sv: "Läs mer →",
    de: "Weiterlesen →",
    fr: "Lire la suite →",
  };
  let blogTitle = titleByLocale[rawLocale] || "News";
  try {
    const data = await sf<{ blog: { title: string; articles: { nodes: any[] } } }>(GET_BLOG_WITH_ARTICLES, { blogHandle, first, language });
    blogTitle = data.blog?.title || blogTitle;
    nodes = data.blog?.articles?.nodes ?? [];
    // Fallback to default language if no localized articles
    if (!nodes?.length && defaultLanguage !== language) {
      try {
        const data2 = await sf<{ blog: { title: string; articles: { nodes: any[] } } }>(GET_BLOG_WITH_ARTICLES, { blogHandle, first, language: defaultLanguage });
        // Keep local heading; just take articles
        nodes = data2.blog?.articles?.nodes ?? nodes;
      } catch {}
    }
  } catch {
    nodes = [];
  }
  if (!nodes?.length) {
    try {
      const data = await sf<{ articles: { nodes: any[] } }>(LIST_ARTICLES, { first, query, language });
      nodes = data.articles?.nodes ?? [];
      if (!nodes?.length && defaultLanguage !== language) {
        const data2 = await sf<{ articles: { nodes: any[] } }>(LIST_ARTICLES, { first, query, language: defaultLanguage });
        nodes = data2.articles?.nodes ?? [];
      }
    } catch {}
  }
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #b8a888 100%)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{blogTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{/* localized via Shopify blog title/excerpt; static subheading removed or could be localized via messages if needed */}</p>
        </header>

        {nodes.length === 0 ? (
          <div className="text-sm text-muted-foreground">{noArticlesByLocale[rawLocale] || noArticlesByLocale.en}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {nodes.slice(0, 4).map((a: any) => (
              <Link
                key={a.handle + a.publishedAt}
                href={`/${rawLocale}/${segment}/${a.handle}`}
                className="group overflow-hidden rounded-md border border-black/10 bg-white shadow-sm transition-colors hover:border-black/20"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {a.image ? (
                    <Image
                      src={a.image.url}
                      alt={a.image.altText || a.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.publishedAt).toLocaleDateString(rawLocale)}
                  </div>
                  <h2 className="mt-1 text-lg font-medium text-foreground line-clamp-2">
                    {a.title}
                  </h2>
                  {a.excerpt ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>
                  ) : null}
                  <span className="mt-3 inline-block text-sm font-medium text-foreground/80 group-hover:underline">
                    {readMoreByLocale[rawLocale] || readMoreByLocale.en}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


