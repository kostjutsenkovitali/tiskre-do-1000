"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import ProductCard from "@/components/ProductCard";
import { usePathname } from "next/navigation";
import { detectLocaleFromPath } from "@/lib/paths";

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
  const pathname = usePathname();
  const locale = detectLocaleFromPath(pathname);
  const L: Record<string, { shop: string; categories: string; priceRange: string; all: string; productsFound: (n: number) => string; noResults: string; clearFilters: string }> = {
    en: { shop: "Shop", categories: "Categories", priceRange: "Price Range", all: "All", productsFound: (n) => `${n} products found`, noResults: "No products found matching your criteria.", clearFilters: "Clear Filters" },
    et: { shop: "Pood", categories: "Kategooriad", priceRange: "Hinnavahemik", all: "Kõik", productsFound: (n) => `Leitud ${n} toodet`, noResults: "Sobivaid tooteid ei leitud.", clearFilters: "Puhasta filtrid" },
    de: { shop: "Shop", categories: "Kategorien", priceRange: "Preisspanne", all: "Alle", productsFound: (n) => `${n} Produkte gefunden`, noResults: "Keine passenden Produkte gefunden.", clearFilters: "Filter zurücksetzen" },
    fr: { shop: "Boutique", categories: "Catégories", priceRange: "Fourchette de prix", all: "Tous", productsFound: (n) => `${n} produits trouvés`, noResults: "Aucun produit correspondant.", clearFilters: "Effacer les filtres" },
    fi: { shop: "Kauppa", categories: "Kategoriat", priceRange: "Hintahaarukka", all: "Kaikki", productsFound: (n) => `Löytyi ${n} tuotetta`, noResults: "Hakuehdoilla ei löytynyt tuotteita.", clearFilters: "Tyhjennä suodattimet" },
    sv: { shop: "Butik", categories: "Kategorier", priceRange: "Prisintervall", all: "Alla", productsFound: (n) => `${n} produkter hittades`, noResults: "Inga produkter hittades.", clearFilters: "Rensa filter" },
  };
  const T = L[locale] || L.en;
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
    name: p.title,
    image: p.featuredImage ? { sourceUrl: p.featuredImage.url, altText: p.featuredImage.altText ?? p.title } : null,
    price: p.price,
  }));

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #e8d8c8 100%)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="space-y-6">
              <Card className="rounded-none border border-gray-200">
                <CardHeader className="rounded-none">
                  <CardTitle className="text-lg">{T.categories}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    key="all-categories"
                    variant={selectedCategory === "all" ? "solid" : "ghost"}
                    className={`w-full justify-start rounded-none ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => selectCategory("all")}
                  >
                    {T.all}
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
                  <CardTitle className="text-lg">{T.priceRange}</CardTitle>
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
              <h1 className="text-2xl font-medium text-foreground mb-2">{T.shop}</h1>
              <p className="text-muted-foreground">{T.productsFound(filtered.length)}</p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {convertedProducts.map((p) => (
                  <ProductCard key={p.id} product={p as any} hrefBase={hrefBase} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{T.noResults}</p>
                <Button
                  className="mt-4 rounded-none"
                  onClick={() => {
                    setSelectedCategory("all");
                    setPriceRange([minSelectable, maxSelectable]);
                  }}
                >
                  {T.clearFilters}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


