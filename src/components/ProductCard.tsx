"use client";

import Image from "next/image";
import Link from "next/link";
type Product = any;
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import * as React from "react";

type Props = {
  product: Product;
  onAddToCart?: (p: Product) => void; // optional hook-up to your cart
};

export default function ProductCard({ product, onAddToCart }: Props) {
  const href = `/shop/${(product as any)?.slug ?? (product as any)?.handle ?? product?.id}`;

  const imgSrc =
    (product as any)?.image?.sourceUrl ||
    (product as any)?.featuredImage?.url ||
    (product as any)?.images?.[0]?.src ||
    "/placeholder.png";

  const displayPriceRaw =
    (product as any)?.price ??
    (product as any)?.salePrice ??
    (product as any)?.regularPrice ??
    "";

  const price = cleanPrice(displayPriceRaw);
  const categories = extractCategories(product);

  return (
    <Link
      href={href}
      className="group relative block rounded-none border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
    >
      {/* Image wrapper – clips zoom so card size stays fixed */}
      <div className="aspect-square bg-black/[.03] dark:bg-white/[.06] relative overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={(product as any)?.image?.altText || (product as any)?.name || "Product"}
            fill
            sizes="(min-width:1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            priority={false}
          />
        ) : null}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="text-sm font-medium leading-tight line-clamp-2">
          {(product as any)?.name ?? (product as any)?.title ?? "Untitled product"}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <span
                key={c.slug ?? c.name}
                className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide border border-gray-300 text-muted-foreground rounded-none"
              >
                {c.name}
              </span>
            ))}
          </div>
        )}

        {/* Price (cleaned) */}
        {price && <div className="text-sm opacity-80">{price}</div>}
      </div>

      {/* Bottom-right Add to cart button */}
      <Button
        size="sm"
        className="absolute bottom-3 right-3 rounded-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onAddToCart) onAddToCart(product);
          else console.log("Add to cart:", (product as any)?.name ?? product?.id);
        }}
      >
        <ShoppingCart className="mr-1 h-4 w-4" />
        Add to cart
      </Button>
    </Link>
  );
}

/* ---------------- helpers ---------------- */

function cleanPrice(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/\u00A0|&nbsp;|&nbp;?/gi, " ") // remove NBSP and stray &nbp
    .replace(/\s+/g, " ")
    .trim();
}

function extractCategories(p: any): { name: string; slug?: string }[] {
  // Supports common WP product shapes
  const nodes =
    p?.categories?.nodes ??
    p?.categories ??
    p?.productCategories?.nodes ??
    [];
  if (Array.isArray(nodes)) {
    return nodes
      .map((n: any) => ({
        name: n?.name ?? n?.title ?? n?.slug ?? "",
        slug: n?.slug,
      }))
      .filter((n) => n.name);
  }
  return [];
}
