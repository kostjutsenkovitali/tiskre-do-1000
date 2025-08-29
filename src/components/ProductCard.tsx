"use client";
import Image from "next/image";
import Link from "next/link";

type ProductLike = {
  id: string;
  slug: string;
  name: string;
  image?: { sourceUrl?: string; altText?: string } | null;
  price?: string | null;
};

type Props = { product: ProductLike; hrefBase?: string };

export default function ProductCard({ product, hrefBase = "/shop" }: Props) {
  return (
    <Link
      href={`${hrefBase}/${product.slug}`}
      className="group block rounded-lg border border-black/10 dark:border-white/10 overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="aspect-square bg-black/[.03] dark:bg-white/[.06] relative">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.image.altText || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <div className="font-medium">{product.name}</div>
        {product.price ? (
          <div className="text-sm opacity-80">{product.price}</div>
        ) : null}
      </div>
    </Link>
  );
}
