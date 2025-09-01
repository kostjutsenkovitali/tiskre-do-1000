"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertCircle, CheckCircle, Package } from "lucide-react";

type Props = { id: string };

export default function InstructionsDynamicClient({ id }: Props) {
  const instructionsData: Record<string, any> = {
    "tee-instructions": {
      name: "Minimalist Cotton T-Shirt",
      sku: "CLO-001",
      category: "Clothing",
      sections: [
        {
          title: "Care Instructions",
          icon: Package,
          content: [
            "Machine wash cold (30°C or below) with like colors",
            "Use mild, eco-friendly detergent without bleach",
            "Turn inside out before washing to preserve print/color",
            "Air dry flat or hang dry - avoid direct sunlight",
            "Iron on low heat if needed, avoiding any printed areas",
            "Do not dry clean or use fabric softener",
          ],
        },
        {
          title: "Sizing Guide",
          icon: CheckCircle,
          content: [
            "Measurements are taken flat across the garment",
            "Size S: Chest 18\", Length 27\", Sleeve 8\"",
            "Size M: Chest 20\", Length 28\", Sleeve 8.5\"",
            "Size L: Chest 22\", Length 29\", Sleeve 9\"",
            "Size XL: Chest 24\", Length 30\", Sleeve 9.5\"",
            "For best fit, compare with a similar garment you own",
          ],
        },
        {
          title: "Important Notes",
          icon: AlertCircle,
          content: [
            "First wash may result in minimal shrinkage (2-3%)",
            "Natural cotton may wrinkle - this is normal",
            "Avoid excessive stretching when wet",
            "Store on hangers to maintain shape",
            "Colors may fade slightly over time with repeated washing",
          ],
        },
      ],
    },
    "bag-instructions": {
      name: "Leather Crossbody Bag",
      sku: "ACC-001",
      category: "Accessories",
      sections: [
        {
          title: "Leather Care",
          icon: Package,
          content: [
            "Clean with a soft, dry cloth regularly",
            "Apply leather conditioner every 3-6 months",
            "Avoid exposure to excessive moisture or heat",
            "Store in provided dust bag when not in use",
            "Keep away from direct sunlight for extended periods",
            "Use leather protector spray before first use",
          ],
        },
        {
          title: "Usage Guidelines",
          icon: CheckCircle,
          content: [
            "Adjust strap length for comfortable crossbody wear",
            "Maximum recommended weight: 3kg (6.6 lbs)",
            "Zipper operates smoothly when bag isn't overpacked",
            "Interior pockets ideal for phone, cards, and small items",
            "Exterior pocket perfect for quick-access items",
            "Magnetic closure provides secure yet easy access",
          ],
        },
        {
          title: "Troubleshooting",
          icon: AlertCircle,
          content: [
            "If leather feels dry, apply conditioner immediately",
            "Water spots: blot immediately, don't rub",
            "Scratches often fade naturally with leather conditioner",
            "Zipper sticking: clean tracks and apply small amount of soap",
            "Color variation is natural in genuine leather",
            "Contact support for hardware issues",
          ],
        },
      ],
    },
    "mug-instructions": {
      name: "Ceramic Coffee Mug",
      sku: "HOM-001",
      category: "Home",
      sections: [
        {
          title: "First Use Setup",
          icon: Package,
          content: [
            "Wash thoroughly with warm soapy water before first use",
            "Rinse completely and dry with soft cloth",
            "Inspect for any chips or cracks before use",
            "Microwave safe up to 2 minutes at medium power",
            "Dishwasher safe on top rack only",
            "Avoid sudden temperature changes",
          ],
        },
        {
          title: "Daily Care",
          icon: CheckCircle,
          content: [
            "Hand wash with mild dish soap for longevity",
            "Avoid abrasive sponges or steel wool",
            "For tough stains, soak in warm water with baking soda",
            "Dry immediately to prevent water spots",
            "Store in cabinet away from other ceramics to prevent chipping",
            "Handle with care - ceramics can break if dropped",
          ],
        },
        {
          title: "Safety Information",
          icon: AlertCircle,
          content: [
            "Maximum temperature: 200°F (93°C)",
            "Not suitable for stovetop or oven use",
            "Contents may be hot - handle with caution",
            "Check temperature before drinking",
            "Do not use if chipped or cracked",
            "Keep away from children when containing hot liquids",
          ],
        },
      ],
    },
    "charger-instructions": {
      name: "Wireless Charging Pad",
      sku: "ELC-001",
      category: "Electronics",
      sections: [
        {
          title: "Setup Instructions",
          icon: Package,
          content: [
            "Connect USB-C cable to charging pad",
            "Connect other end to wall adapter (5V/2A minimum)",
            "Place on flat, stable surface away from metal objects",
            "LED indicator will show steady blue when ready",
            "Remove any thick cases (>3mm) from device",
            "Ensure device supports Qi wireless charging",
          ],
        },
        {
          title: "Operating Instructions",
          icon: CheckCircle,
          content: [
            "Place device on center of charging pad",
            "Green LED indicates charging in progress",
            "Blue LED indicates charging complete",
            "Red LED indicates charging error or foreign object",
            "Charging efficiency: up to 10W for compatible devices",
            "Average charging time: 2-4 hours depending on device",
          ],
        },
        {
          title: "Troubleshooting",
          icon: AlertCircle,
          content: [
            "No charging: check cable connections and power source",
            "Slow charging: remove case or reposition device",
            "Overheating: ensure proper ventilation around pad",
            "LED flashing red: remove metal objects or foreign materials",
            "Device not recognized: verify Qi compatibility",
            "For persistent issues, contact technical support",
          ],
        },
      ],
    },
  };

  const product = instructionsData[id as string];

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Instructions Not Found</h1>
          <Link href="/instructions">
            <Button>Return to Instructions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/instructions" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Instructions
        </Link>

        <div className="mb-8">
          <Badge variant="secondary" className="mb-4 capitalize">{product.category}</Badge>
          <h1 className="text-3xl font-medium text-foreground mb-2">{product.name}</h1>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>

        <div className="mb-8">
          <Button variant="outline" className="hover:bg-black hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Download PDF Instructions
          </Button>
        </div>

        <div className="space-y-6">
          {product.sections.map((section: any, index: number) => {
            const IconComponent = section.icon as React.ComponentType<{ className?: string }>;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IconComponent className="h-5 w-5 mr-2" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-foreground mb-2">Need Additional Help?</h3>
              <p className="text-muted-foreground mb-4">Our support team is here to assist you with any questions about your product.</p>
              <Link href="/contact">
                <Button>Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


