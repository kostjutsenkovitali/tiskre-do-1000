"use client";
import Link from "next/link";
import { Product } from "@/lib/wpData";
import ProductCard from "@/components/ProductCard";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products?.length) return null;
  return (
    <div className="mt-16">
      <h2 className="text-xl font-medium mb-4">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}


