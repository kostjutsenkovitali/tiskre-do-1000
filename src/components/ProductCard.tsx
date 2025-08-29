"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { detectLocaleFromPath } from "@/lib/paths";

type ProductLike = {
  id: string;
  slug: string;
  name: string;
  image?: { sourceUrl?: string; altText?: string } | null;
  price?: string | null;
};

type Props = { product: ProductLike; hrefBase?: string };

export default function ProductCard({ product, hrefBase = "/shop" }: Props) {
  const pathname = usePathname();
  const locale = detectLocaleFromPath(pathname);
  const SOLD_OUT: Record<string, string> = {
    en: "Sold out",
    et: "Läbi müüdud",
    de: "Ausverkauft",
    fr: "Épuisé",
    fi: "Loppuunmyyty",
    sv: "Slutsåld",
  };
  const displayName = product.name || (product as any)?.title || "";
  return (
    <Link
      href={`${hrefBase}/${product.slug}`}
      className="group block rounded-none border border-black/10 dark:border-white/10 overflow-hidden hover:shadow-sm transition-[box-shadow,transform,border-color] duration-300"
    >
      <div className="aspect-square bg-black/[.03] dark:bg-white/[.06] relative overflow-hidden">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.image.altText || displayName}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <div className="text-sm font-medium group-hover:underline underline-offset-4">{displayName}</div>
        {product.price ? (
          <div className="text-sm opacity-80">{product.price}</div>
        ) : (
          <div className="text-sm opacity-80">{SOLD_OUT[locale] || SOLD_OUT.en}</div>
        )}
      </div>
    </Link>
  );
}
