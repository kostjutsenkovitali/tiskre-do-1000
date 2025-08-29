"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import ProductCard from "@/components/ProductCard";

interface FormattedProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  currencyCode: string;
  featuredImage: {
    url: string;
    altText?: string;
  } | null;
  availableForSale: boolean;
  tags: string[];
  vendor?: string;
}

interface FormattedCollection {
  id: string;
  slug: string;
  name: string;
}

interface ShopClientProps {
  products: FormattedProduct[];
  collections: FormattedCollection[];
  hrefBase?: string;
}

export default function ShopClient({ products, collections, hrefBase = "/shop" }: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
  };

  const numericPrice = (priceStr: string) => {
    const n = parseFloat(priceStr);
    return isNaN(n) ? 0 : n;
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const price = numericPrice(p.price);
      const inPrice = price >= priceRange[0] && price <= priceRange[1];

      const inCategory =
        selectedCategory === "all"
          ? true
          : p.tags.some((tag) => tag.toLowerCase().includes(selectedCategory.toLowerCase())) ||
            (p.vendor && p.vendor.toLowerCase().includes(selectedCategory.toLowerCase()));

      return inPrice && inCategory;
    });
  }, [products, selectedCategory, priceRange]);

  const minSelectable = 0;
  const maxSelectable = 2000;

  const convertedProducts = filtered.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: p.price,
    regularPrice: p.price,
    salePrice: undefined,
    currencyCode: p.currencyCode,
    featuredImage: p.featuredImage?.url || "",
    availableForSale: p.availableForSale,
    tags: p.tags,
    vendor: p.vendor,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="space-y-6">
              <Card className="rounded-none border border-gray-200">
                <CardHeader className="rounded-none">
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    key="all-categories"
                    variant={selectedCategory === "all" ? "solid" : "ghost"}
                    className={`w-full justify-start rounded-none ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => selectCategory("all")}
                  >
                    All
                  </Button>

                  {collections.map((collection) => {
                    const active = selectedCategory === collection.slug;
                    return (
                      <Button
                        key={collection.id}
                        variant={active ? "solid" : "ghost"}
                        className={`w-full justify-start rounded-none ${active ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => selectCategory(collection.slug)}
                      >
                        {collection.name}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-none border border-gray-200">
                <CardHeader className="rounded-none">
                  <CardTitle className="text-lg">Price Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Slider value={priceRange} onValueChange={setPriceRange} min={minSelectable} max={maxSelectable} step={5} className="w-full" />
                  <div className="flex justify-between text-sm opacity-70">
                    <span>€{priceRange[0]}</span>
                    <span>€{priceRange[1]}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-foreground mb-2">Shop</h1>
              <p className="text-muted-foreground">{filtered.length} products found</p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {convertedProducts.map((p) => (
                  <ProductCard key={p.id} product={p as any} hrefBase={hrefBase} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found matching your criteria.</p>
                <Button
                  className="mt-4 rounded-none"
                  onClick={() => {
                    setSelectedCategory("all");
                    setPriceRange([minSelectable, maxSelectable]);
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


