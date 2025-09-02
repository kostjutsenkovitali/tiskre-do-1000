"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ShopClient from "@/app/[locale]/[segment]/ShopClient";
import ProductDetailClient from "@/components/shop/ProductDetailClient";
import { GET_PRODUCT, GET_PRODUCTS, GET_COLLECTIONS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import { detectLocaleFromPath } from "@/lib/paths";
import { resolveInContext } from "@/i18n/config";

type SpaRouterProps = {
  collections?: Array<{ id: string; slug: string; name: string }>;
};

export default function SpaRouter({ collections: initialCollections }: SpaRouterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = detectLocaleFromPath(pathname || "/");
  const { country, language } = resolveInContext(locale as any);

  const seg = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    return parts[1] || ""; // after /[locale]
  }, [pathname]);

  const slug = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    return parts[2] || ""; // /[locale]/[segment]/[slug]
  }, [pathname]);

  const [collections, setCollections] = useState(initialCollections || []);
  const [products, setProducts] = useState<any[]>([]);
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (!seg || seg === "home") {
          setLoading(false);
          return;
        }
        if (slug) {
          // detail view
          const data = await sf<{ product: any }>(GET_PRODUCT, { handle: slug, country, language });
          setProduct(data.product || null);
          setProducts([]);
          setCollections(initialCollections || []);
        } else {
          // index view
          const pro = await sf<any>(GET_PRODUCTS, { first: 12, country, language });
          const list = pro?.products?.nodes || [];
          setProducts(
            list.map((n: any) => ({
              id: n.handle,
              slug: n.handle,
              title: n.title,
              description: "",
              price: n.priceRange?.minVariantPrice?.amount,
              currencyCode: n.priceRange?.minVariantPrice?.currencyCode,
              featuredImage: n.featuredImage ? { url: n.featuredImage.url, altText: n.featuredImage.altText || undefined } : null,
              availableForSale: true,
              tags: n.tags || [],
              vendor: n.vendor,
              collections: n.collections?.nodes || [],
            }))
          );
          
          // Only fetch collections if not provided
          if (!initialCollections || initialCollections.length === 0) {
            const cols = await sf<any>(GET_COLLECTIONS, { first: 50, language });
            setCollections((cols?.collections?.nodes || []).map((c: any) => ({ id: c.id || c.handle, slug: c.handle, name: c.title })));
          } else {
            setCollections(initialCollections);
          }
          setProduct(null);
        }
      } catch {
        setProducts([]);
        setCollections(initialCollections || []);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [seg, slug, country, language, initialCollections]);

  if (!seg || seg === "home") return null;
  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  if (product) {
    const firstVariant = product?.variants?.nodes?.[0];
    const price = firstVariant ? `${firstVariant.price.amount} ${firstVariant.price.currencyCode}` : "";
    const galleryNodes = (product.media?.nodes || [])
      .map((m: any) => (m.__typename === "MediaImage" ? { sourceUrl: m.image?.url, altText: m.image?.altText } : null))
      .filter((n: any) => !!n && typeof n.sourceUrl === "string");
    const variantNodes = (product.variants?.nodes || []).map((v: any) => ({ id: v.id, title: v.title, availableForSale: v.availableForSale }));
    const productLike = {
      id: product.id,
      slug: product.handle,
      name: product.title,
      description: product.descriptionHtml,
      sku: firstVariant?.sku,
      variants: { nodes: variantNodes },
      stockStatus: firstVariant?.availableForSale ? "IN_STOCK" : "OUT_OF_STOCK",
      image: null,
      price,
      galleryImages: { nodes: galleryNodes },
      bulletPoints: [],
      instructionJpg: null,
      instructionPdf: null,
    } as any;
    return <ProductDetailClient locale={locale} product={productLike} related={[]} />;
  }

  return <ShopClient products={products as any} categories={collections as any} hrefBase={`/${locale}/${seg}`} />;
}