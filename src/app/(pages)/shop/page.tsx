"use client";
import { useEffect, useMemo, useState } from "react";
import { getProductCategories, getProducts, Product } from "@/lib/wpData";
import ProductCard from "@/components/ProductCard";

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(1000);

  useEffect(() => {
    getProductCategories().then(setCategories);
    getProducts(100).then(setAllProducts);
  }, []);

  const toggleCategory = (slug: string) => {
    setActiveCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const numericPrice = (p?: string | null) => {
    if (!p) return undefined;
    const n = parseFloat(p.replace(/[^0-9.,]/g, "").replace(",", "."));
    return isNaN(n) ? undefined : n;
  };

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const price = numericPrice(p.price ?? p.salePrice ?? p.regularPrice ?? null);
      const inPrice = price === undefined ? true : price >= priceMin && price <= priceMax;
      const inCategory = activeCategories.length === 0 ? true : activeCategories.some((slug) => JSON.stringify(p).includes(slug));
      return inPrice && inCategory;
    });
  }, [allProducts, activeCategories, priceMin, priceMax]);

  const minSelectable = 0;
  const maxSelectable = 2000;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <div className="text-sm font-medium mb-2">Categories</div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => {
              const active = activeCategories.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    active ? "bg-foreground text-background" : "border-black/10 dark:border-white/10"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-[420px]">
          <div className="text-sm font-medium mb-2">Price</div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={minSelectable}
              max={maxSelectable}
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min={minSelectable}
              max={maxSelectable}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="text-xs opacity-70 mt-1">€{priceMin} - €{priceMax}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}



