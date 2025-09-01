import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";
import { resolveInContext, DEFAULT_LOCALE } from "@/i18n/config";
import type { GetProductsResponse } from "@/lib/types/shopify";

type Props = { params: { slug: string } };

export default async function ProductDetailPage({ params }: Props) {
  const handle = params.slug;
  const data = await sf<{ product: any }>(GET_PRODUCT, { handle });
  const p = data.product;
  if (!p) return notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-semibold">{p.title}</h1>
      {p.variants?.nodes?.[0] ? (
        <div className="mb-4 text-lg">
          {p.variants.nodes[0].price.amount} {p.variants.nodes[0].price.currencyCode}
        </div>
      ) : null}
      {p.variants?.nodes?.[0]?.id ? (
        <AddToCartButton variantId={p.variants.nodes[0].id} />
      ) : (
        <p className="text-sm text-red-600">No purchasable variant.</p>
      )}
      <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} />
    </div>
  );
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
