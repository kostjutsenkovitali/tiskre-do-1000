import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { GET_PRODUCT } from "@/lib/queries/products";
import { sf } from "@/lib/shopify";

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


