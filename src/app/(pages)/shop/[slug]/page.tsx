import { notFound } from "next/navigation";
import { getProducts, Product } from "@/lib/wpData";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

type Props = { params: { slug: string } };

export default async function ProductDetailPage({ params }: Props) {
  const all = await getProducts(100);
  const product = all.find((p) => p.slug === params.slug);
  if (!product) return notFound();

  const related = all.filter((p) => p.slug !== product.slug).slice(0, 8);

  return (
    <ProductDetailClient product={product} related={related} />
  );
}


