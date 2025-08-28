import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {isLocale, getSegment, resolveInContext} from "@/i18n/config";
import {GET_PRODUCTS} from "@/lib/queries/products";
import {LIST_ARTICLES, GET_BLOG_WITH_ARTICLES} from "@/lib/queries/blog";
import {sf} from "@/lib/shopify";
import type {GetProductsResponse} from "@/lib/types/shopify";

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
    const products = data.products.nodes;
    const pageInfo = data.products.pageInfo;
    const basePath = `/${rawLocale}/${segment}`;
    const nextHref = pageInfo.hasNextPage && pageInfo.endCursor
      ? `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), after: pageInfo.endCursor }).toString()}`
      : null;
    const prevHref = after
      ? `${basePath}${q ? `?${new URLSearchParams({ q }).toString()}` : ""}`
      : null;

    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Shop</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <Link key={p.handle} href={`/${rawLocale}/${segment}/${p.handle}`} className="rounded border p-3">
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                {p.featuredImage ? (
                  <Image src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} fill className="object-cover" />
                ) : null}
              </div>
              <div className="mt-2 text-sm font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">
                {p.priceRange.minVariantPrice.amount} {p.priceRange.minVariantPrice.currencyCode}
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div>
            {prevHref ? <Link href={prevHref} className="text-sm underline">Prev</Link> : <span className="text-sm text-muted-foreground">Prev</span>}
          </div>
          <div>
            {nextHref ? <Link href={nextHref} className="text-sm underline">Next</Link> : <span className="text-sm text-muted-foreground">Next</span>}
          </div>
        </div>
      </div>
    );
  }

  // Blog index
  const first = Number(searchParams?.first || 12);
  const query = searchParams?.query || undefined;
  const blogHandle = "news";
  let nodes: any[] = [];
  let blogTitle = "News";
  try {
    const data = await sf<{ blog: { title: string; articles: { nodes: any[] } } }>(GET_BLOG_WITH_ARTICLES, {
      blogHandle,
      first,
    });
    blogTitle = data.blog?.title || blogTitle;
    nodes = data.blog?.articles?.nodes ?? [];
  } catch (err) {
    try {
      const data = await sf<{ articles: { nodes: any[] } }>(LIST_ARTICLES, { first, query });
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
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            <div className="mt-3">
              <div className="text-sm text-muted-foreground">{new Date(a.publishedAt).toLocaleDateString()}</div>
              <h2 className="line-clamp-2 text-base font-medium">{a.title}</h2>
              {a.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


