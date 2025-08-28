"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductCategories, getProducts, Product } from "@/lib/wpData";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

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
    // NOTE: display cleanup is handled inside ProductCard; this is only for filtering.
  };

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const price = numericPrice(p.price ?? p.salePrice ?? p.regularPrice ?? null);
      const inPrice = price === undefined ? true : price >= priceMin && price <= priceMax;

      // keep your previous logic to be robust to different Product shapes
      const inCategory =
        activeCategories.length === 0
          ? true
          : activeCategories.some((slug) => JSON.stringify(p).includes(slug));

      return inPrice && inCategory;
    });
  }, [allProducts, activeCategories, priceMin, priceMax]);

  const minSelectable = 0;
  const maxSelectable = 2000;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="space-y-6">
              {/* Categories */}
              <Card className="rounded-none border border-gray-200">
                <CardHeader className="rounded-none">
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* All categories */}
                  <Button
                    key="all-categories"
                    variant={activeCategories.length === 0 ? "default" : "ghost"}
                    className="w-full justify-start rounded-none"
                    onClick={() => setActiveCategories([])}
                  >
                    All
                  </Button>

                  {categories.map((cat) => {
                    const active = activeCategories.includes(cat.slug);
                    return (
                      <Button
                        key={cat.id}
                        variant={active ? "default" : "ghost"}
                        className="w-full justify-start rounded-none"
                        onClick={() => toggleCategory(cat.slug)}
                      >
                        {cat.name}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Price Range */}
              <Card className="rounded-none border border-gray-200">
                <CardHeader className="rounded-none">
                  <CardTitle className="text-lg">Price Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Slider
                    value={[priceMin, priceMax]}
                    onValueChange={([min, max]) => {
                      setPriceMin(min);
                      setPriceMax(max);
                    }}
                    min={minSelectable}
                    max={maxSelectable}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm opacity-70">
                    <span>€{priceMin}</span>
                    <span>€{priceMax}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-foreground mb-2">Shop</h1>
              <p className="text-muted-foreground">{filtered.length} products found</p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found matching your criteria.</p>
                <Button
                  className="mt-4 rounded-none"
                  onClick={() => {
                    setActiveCategories([]);
                    setPriceMin(minSelectable);
                    setPriceMax(maxSelectable);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
