"use client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
type Product = any;

export default function RelatedProducts({ products, hrefBase }: { products: Product[]; hrefBase?: string }) {
  if (!products?.length) return null;
  return (
    <div className="mt-16">
      <h2 className="text-xl font-medium mb-4">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} hrefBase={hrefBase} />
        ))}
      </div>
    </div>
  );
}


