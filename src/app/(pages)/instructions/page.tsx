"use client";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InstructionsPage() {
  const productCategories = [
    {
      name: "Clothing",
      products: [
        { name: "Minimalist Cotton T-Shirt", id: "tee-instructions", sku: "CLO-001" },
        { name: "Organic Cotton Hoodie", id: "hoodie-instructions", sku: "CLO-002" },
        { name: "Sustainable Denim Jacket", id: "jacket-instructions", sku: "CLO-003" },
        { name: "Bamboo Fiber Socks", id: "socks-instructions", sku: "CLO-004" },
      ]
    },
    {
      name: "Accessories",
      products: [
        { name: "Leather Crossbody Bag", id: "bag-instructions", sku: "ACC-001" },
        { name: "Minimalist Watch", id: "watch-instructions", sku: "ACC-002" },
        { name: "Canvas Backpack", id: "backpack-instructions", sku: "ACC-003" },
        { name: "Wool Beanie", id: "beanie-instructions", sku: "ACC-004" },
      ]
    },
    {
      name: "Home",
      products: [
        { name: "Ceramic Coffee Mug", id: "mug-instructions", sku: "HOM-001" },
        { name: "Wooden Cutting Board", id: "board-instructions", sku: "HOM-002" },
        { name: "Glass Water Bottle", id: "bottle-instructions", sku: "HOM-003" },
        { name: "Linen Table Runner", id: "runner-instructions", sku: "HOM-004" },
      ]
    },
    {
      name: "Electronics",
      products: [
        { name: "Wireless Charging Pad", id: "charger-instructions", sku: "ELC-001" },
        { name: "Bluetooth Speaker", id: "speaker-instructions", sku: "ELC-002" },
        { name: "USB-C Cable", id: "cable-instructions", sku: "ELC-003" },
        { name: "Power Bank", id: "powerbank-instructions", sku: "ELC-004" },
      ]
    },
    {
      name: "Beauty",
      products: [
        { name: "Natural Face Cream", id: "cream-instructions", sku: "BEA-001" },
        { name: "Organic Shampoo Bar", id: "shampoo-instructions", sku: "BEA-002" },
        { name: "Essential Oil Set", id: "oils-instructions", sku: "BEA-003" },
        { name: "Bamboo Toothbrush", id: "toothbrush-instructions", sku: "BEA-004" },
      ]
    },
    {
      name: "Fitness",
      products: [
        { name: "Yoga Mat", id: "yoga-instructions", sku: "FIT-001" },
        { name: "Resistance Bands Set", id: "bands-instructions", sku: "FIT-002" },
        { name: "Water Bottle with Tracker", id: "tracker-instructions", sku: "FIT-003" },
        { name: "Foam Roller", id: "roller-instructions", sku: "FIT-004" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Product Instructions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find detailed setup, care, and usage instructions for all our products organized by category.
          </p>
        </div>

        <div className="mb-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {productCategories.map((category, index) => (
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
                      <Card key={product.id} className="transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">{product.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                            </div>
                            <Link 
                              href={`/instructions/${product.id}`}
                              className="inline-flex items-center text-foreground hover:underline"
                            >
                              View Instructions
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



