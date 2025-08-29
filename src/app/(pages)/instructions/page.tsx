import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sf } from "@/lib/shopify";
import { GET_COLLECTIONS, GET_COLLECTION_PRODUCTS } from "@/lib/queries/products";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { productPath } from "@/lib/paths";

export default async function InstructionsPage() {
  // Fetch Shopify collections and a few products per collection
  const collectionsRes = await sf<{ collections: { nodes: Array<{ id: string; handle: string; title: string }> } }>(GET_COLLECTIONS, { first: 20 });
  const collections = collectionsRes?.collections?.nodes || [];

  const categories = [] as Array<{ name: string; products: Array<{ name: string; handle: string }> }>;
  for (const c of collections) {
    try {
      const prodsRes = await sf<{ collection: { products: { nodes: Array<{ handle: string; title: string }> } } }>(GET_COLLECTION_PRODUCTS, { handle: c.handle, first: 12 });
      const nodes = prodsRes?.collection?.products?.nodes || [];
      if (nodes.length) {
        categories.push({ name: c.title, products: nodes.map((n) => ({ name: n.title, handle: n.handle })) });
      }
    } catch {}
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #98a8b8 0%, #f8f8f8 100%)" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Product Instructions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find detailed setup, care, and usage instructions for all our products organized by category.
          </p>
        </div>

        <div className="mb-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {categories.map((category, index) => (
              <AccordionItem key={category.name} value={`category-${index}`} className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-xl font-medium text-left">{category.name}</h2>
                    <Badge variant="secondary" className="ml-4">
                      {category.products.length} products
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {category.products.map((product) => (
                      <Card key={product.handle} className="transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">{product.name}</h3>
                            </div>
                            <Link 
                              href={productPath(DEFAULT_LOCALE as any, product.handle)}
                              className="inline-flex items-center text-foreground hover:underline"
                            >
                              View Product
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Can't find instructions for your product? {" "}
            <Link href="/contact" className="underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



