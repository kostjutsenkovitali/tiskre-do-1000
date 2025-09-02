"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import RelatedProducts from "@/components/shop/RelatedProducts";
import { shopPath } from "@/lib/paths";
import sanitizeHtml from "sanitize-html";

type Product = any;

type Props = {
  locale: string;
  product: Product;
  related?: Product[]; // Make related optional
};

function sanitizePrice(htmlish: string): string {
  return htmlish.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function ProductDetailClient({ locale, product, related = [] }: Props) { // Default to empty array
  const { addAndCheckout } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  // Fix image handling to work with Shopify data structure
  const images = useMemo(() => {
    const list: string[] = [];
    
    // Add main image if available
    if (product.image?.url) {
      list.push(product.image.url);
    }
    
    // Add gallery images if available (Shopify structure)
    if (product.images?.edges) {
      product.images.edges.forEach((edge: any) => {
        if (edge?.node?.url) {
          list.push(edge.node.url);
        }
      });
    }
    
    // Add media images if available (Shopify structure)
    if (product.media?.nodes) {
      product.media.nodes.forEach((node: any) => {
        if (node?.image?.url) {
          list.push(node.image.url);
        }
      });
    }
    
    // Remove duplicates
    const uniqueImages = Array.from(new Set(list));
    
    console.log("Product images found:", uniqueImages.length, uniqueImages);
    return uniqueImages;
  }, [product]);

  const visibleCount = 6;

  const ensureThumbVisible = (idx: number) => {
    if (idx < thumbStart) setThumbStart(idx);
    else if (idx > thumbStart + (visibleCount - 1))
      setThumbStart(idx - (visibleCount - 1));
  };

  const goTo = (idx: number) => {
    const next = (idx + images.length) % images.length;
    setSelectedImage(next);
    ensureThumbVisible(next);
  };

  const goPrev = () => goTo(selectedImage - 1);
  const goNext = () => goTo(selectedImage + 1);

  const canScrollThumbsLeft = thumbStart > 0;
  const canScrollThumbsRight =
    images.length > visibleCount && thumbStart + visibleCount < images.length;

  // Fix price handling for Shopify data structure
  let displayPrice = "";
  if (product.price) {
    displayPrice = sanitizePrice(product.price);
  } else if (product.variants?.nodes?.[0]?.price?.amount) {
    // Handle Shopify price structure
    const price = product.variants.nodes[0].price;
    displayPrice = `${price.amount} ${price.currencyCode}`;
  } else {
    displayPrice = "Price not available";
  }

  const mockReviews = [
    { id: 1, author: "Sarah M.", rating: 5, comment: "Excellent quality and fast shipping!" },
    { id: 2, author: "John D.", rating: 4, comment: "Great product, exactly as described." },
    { id: 3, author: "Emma K.", rating: 5, comment: "Love the minimalist design. Perfect for my needs." },
  ];

  const labels: Record<string, {
    backToShop: string;
    product: string;
    sku: string;
    inStock: string;
    outOfStock: string;
    quantity: string;
    addToCart: string;
    description: string;
    watchVideo: string;
    technical: string;
    noTechData: string;
    reviews: string;
    instructions: string;
  }> = {
    en: { backToShop: "Back to Shop", product: "Product", sku: "SKU", inStock: "In stock", outOfStock: "Out of stock", quantity: "Quantity:", addToCart: "Add to Cart", description: "Description", watchVideo: "Watch Video", technical: "Technical Parameters", noTechData: "No technical data available.", reviews: "Reviews", instructions: "Instructions" },
    et: { backToShop: "Tagasi poodi", product: "Toode", sku: "SKU", inStock: "Laos", outOfStock: "Läbi müüdud", quantity: "Kogus:", addToCart: "Lisa ostukorvi", description: "Kirjeldus", watchVideo: "Vaata videot", technical: "Tehnilised andmed", noTechData: "Tehnilised andmed puuduvad.", reviews: "Arvustused", instructions: "Juhendid" },
    de: { backToShop: "Zurück zum Shop", product: "Produkt", sku: "SKU", inStock: "Auf Lager", outOfStock: "Nicht auf Lager", quantity: "Menge:", addToCart: "In den Warenkorb", description: "Beschreibung", watchVideo: "Video ansehen", technical: "Technische Daten", noTechData: "Keine technischen Daten verfügbar.", reviews: "Bewertungen", instructions: "Anleitungen" },
    fr: { backToShop: "Retour à la boutique", product: "Produit", sku: "SKU", inStock: "En stock", outOfStock: "Rupture de stock", quantity: "Quantité:", addToCart: "Ajouter au panier", description: "Description", watchVideo: "Regarder la vidéo", technical: "Paramètres techniques", noTechData: "Aucune donnée technique disponible.", reviews: "Avis", instructions: "Guides" },
    fi: { backToShop: "Takaisin kauppaan", product: "Tuote", sku: "SKU", inStock: "Varastossa", outOfStock: "Loppu", quantity: "Määrä:", addToCart: "Lisää koriin", description: "Kuvaus", watchVideo: "Katso video", technical: "Tekniset tiedot", noTechData: "Teknisiä tietoja ei saatavilla.", reviews: "Arvostelut", instructions: "Ohjeet" },
    sv: { backToShop: "Tillbaka till butik", product: "Produkt", sku: "SKU", inStock: "I lager", outOfStock: "Slut i lager", quantity: "Antal:", addToCart: "Lägg i varukorgen", description: "Beskrivning", watchVideo: "Titta på video", technical: "Tekniska parametrar", noTechData: "Inga tekniska data tillgängliga.", reviews: "Recensioner", instructions: "Instruktioner" },
  };

  const L = labels[locale] || labels.en;
  const backHref = shopPath(locale as any);
  
  // Fix bullet points handling for Shopify data structure
  let bulletPoints: string[] = Array.isArray(product?.bulletPoints)
    ? (product.bulletPoints as string[]).filter((x) => typeof x === "string")
    : [];
    
  console.log("Bullet points from product.bulletPoints:", product?.bulletPoints);
  console.log("Processed bulletPoints array:", bulletPoints);
    
  // Handle bullet points from metafield if not in product object directly
  if (bulletPoints.length === 0 && product?.bulletPointsMetafield) {
    const mf = product.bulletPointsMetafield;
    console.log("Using bulletPointsMetafield:", mf);
    // Check if mf has a value property (which is typical for metafields)
    if (mf && typeof mf === "object" && "value" in mf) {
      console.log("Metafield has value property:", mf.value);
      if (typeof mf.value === "string") {
        bulletPoints.push(...mf.value.split("\n").filter(Boolean));
      }
    } else if (typeof mf === "string") {
      bulletPoints.push(...mf.split("\n").filter(Boolean));
    } else if (Array.isArray(mf)) {
      bulletPoints.push(...mf.filter((x: any) => typeof x === "string"));
    }
    console.log("Bullet points after metafield processing:", bulletPoints);
  }
    
  // Fix instruction handling for Shopify data structure
  let instructionJpg: string | null = product?.instructionJpg || null;
  let instructionPdf: string | null = product?.instructionPdf || null;
  
  // Handle instruction files from metafields if not in product object directly
  if (!instructionJpg && product?.instructionJpgMetafield) {
    const metafield = product.instructionJpgMetafield;
    if (typeof metafield === "string") {
      instructionJpg = metafield;
    } else if (metafield?.value) {
      instructionJpg = metafield.value;
    } else if (metafield?.reference?.url) {
      instructionJpg = metafield.reference.url;
    } else if (metafield?.references?.nodes?.[0]?.url) {
      instructionJpg = metafield.references.nodes[0].url;
    }
  }
  
  if (!instructionPdf && product?.instructionPdfMetafield) {
    const metafield = product.instructionPdfMetafield;
    if (typeof metafield === "string") {
      instructionPdf = metafield;
    } else if (metafield?.value) {
      instructionPdf = metafield.value;
    } else if (metafield?.reference?.url) {
      instructionPdf = metafield.reference.url;
    } else if (metafield?.references?.nodes?.[0]?.url) {
      instructionPdf = metafield.references.nodes[0].url;
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #e8d8c8 100%)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {L.backToShop}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT: Images */}
          <div className="space-y-4">
            {/* Main image with thin grey frame, square corners */}
            <div className="relative aspect-square bg-muted border border-gray-300 overflow-hidden group rounded-none">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage] ?? images[0]}
                  alt={product.title || "Product image"}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}

              {images.length > 1 ? (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>

            {/* 6-up thumbnail carousel (square thumbs, straight corners) */}
            {images.length > 0 ? (
              <div className="w-full">
                <div className="relative flex items-center gap-2">
                  {/* Left scroll button - only show if we have more images than visible slots AND we're not at the start */}
                  {images.length > visibleCount && (
                    <button
                      aria-label="Scroll thumbnails left"
                      onClick={() => setThumbStart(Math.max(0, thumbStart - 1))}
                      disabled={!canScrollThumbsLeft}
                      className="w-8 h-8 border border-border rounded-none flex items-center justify-center disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-6 gap-2 flex-1">
                    {Array(6).fill(null).map((_, index) => {
                      if (index < images.length) {
                        // This is an actual image
                        const isActive = index === selectedImage;
                        return (
                          <button
                            key={`image-${index}`}
                            onClick={() => goTo(index)}
                            className={`aspect-square w-full border ${
                              isActive
                                ? "border-black"
                                : "border-border hover:border-black/40"
                            } rounded-none overflow-hidden`}
                            aria-label={`Select image ${index + 1}`}
                          >
                            <Image
                              src={images[index]}
                              alt={`${product.title || "Product"} ${index + 1}`}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                              sizes="100px"
                            />
                          </button>
                        );
                      } else {
                        // Empty placeholder thumbnails to maintain 6-column grid
                        return (
                          <div 
                            key={`placeholder-${index}`}
                            className="aspect-square w-full border border-gray-100 rounded-none overflow-hidden bg-gray-50 flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        );
                      }
                    })}
                  </div>

                  {/* Right scroll button - only show if we have more images than visible slots AND we're not at the end */}
                  {images.length > visibleCount && (
                    <button
                      aria-label="Scroll thumbnails right"
                      onClick={() =>
                        setThumbStart(
                          Math.min(images.length - visibleCount, thumbStart + 1)
                        )
                      }
                      disabled={!canScrollThumbsRight}
                      className="w-8 h-8 border border-border rounded-none flex items-center justify-center disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: Details */}
          <div className="flex flex-col space-y-6">
            <div>
              <Badge variant="secondary" className="mb-4 capitalize rounded-none">
                {L.product}
              </Badge>
              <h1 className="text-3xl font-medium text-foreground mb-2">
                {product.title || "Product Title"}
              </h1>
              <p className="text-sm text-muted-foreground mb-1">
                {L.sku}: {product.sku ? product.sku.replace('gid://shopify/Product/', '') : product.id || "—"}
              </p>
              <p className="text-sm mb-4">
                {product.availableForSale !== false ? (
                  <span className="text-green-700">{L.inStock}</span>
                ) : (
                  <span className="text-red-600">{L.outOfStock}</span>
                )}
              </p>
              <p className="text-2xl font-medium text-foreground mb-6">
                {displayPrice}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">{L.quantity}</span>
                <div className="flex items-center border border-border rounded-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 text-center min-w-[3rem]">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <AddToCartButton
                  className="w-full h-11 rounded-none bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  variantId={product?.variants?.nodes?.[0]?.id}
                  productId={!product?.variants?.nodes?.length ? product?.id : undefined}
                  quantity={quantity}
                />
                <div className="grid grid-cols-3 gap-3">
                  {/* Google Pay */}
                  <button
                    type="button"
                    aria-label="Google Pay"
                    className="h-10 w-full rounded-[6px] flex items-center justify-center gap-2 bg-black text-white shadow-sm hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const merchId = product?.variants?.nodes?.[0]?.id || product?.id;
                      if (merchId) addAndCheckout(merchId, quantity);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#4285F4" d="M255.68 133.5c0-10.2-.92-20-2.64-29.5H130v55.8h70.56c-3.04 16.4-12.14 30.3-25.88 39.6v32.9h41.88c24.52-22.6 39.12-56 39.12-98.8z"/>
                      <path fill="#34A853" d="M130 261.1c35.28 0 64.92-11.7 86.56-31.7l-41.88-32.9c-11.6 7.8-26.52 12.5-44.68 12.5-34.3 0-63.4-22.9-73.8-53.9H12.3v33.8c21.58 42.7 65.78 72.2 117.7 72.2z"/>
                      <path fill="#FBBC05" d="M56.2 155.1c-2.7-8.1-4.2-16.7-4.2-25.5s1.5-17.4 4.2-25.5V70.3H12.3C4.4 86.1 0 104.2 0 123.6s4.4 37.6 12.3 53.3l43.9-33.8C66.6 73.9 95.7 50.2 130 50.2z"/>
                      <path fill="#EA4335" d="M130 50.2c19.2 0 36.4 6.6 49.9 19.4l37.4-37.4C194.9 12 165.3 0 130 0 78.08 0 33.88 29.5 12.3 72.3l43.9 33.8C66.6 73.9 95.7 50.2 130 50.2z"/>
                    </svg>
                    <span className="text-sm font-medium">G&nbsp;Pay</span>
                  </button>

                  {/* PayPal */}
                  <button
                    type="button"
                    aria-label="PayPal"
                    className="h-10 w-full rounded-[6px] flex items-center justify-center gap-2 bg-[#FFC439] text-[#003087] shadow-sm hover:opacity-95 transition-opacity"
                    onClick={() => {
                      const merchId = product?.variants?.nodes?.[0]?.id || product?.id;
                      if (merchId) addAndCheckout(merchId, quantity);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#003087" d="M30.3 8.2c-1-4.1-5.1-6.2-9.7-6.2H11c-.6 0-1.1.4-1.2 1l-3.6 22c-.1.6.3 1.2 1 1.2h5.7l.8-4.6c.1-.6.6-1 1.2-1h2.5c5.9 0 10.8-2.3 12.2-8.9.1-.5.1-1.1.1-1.7s0-1.1-.1-1.8z"/>
                      <path fill="#001C64" d="M16.3 10.9c.1-.6.6-1 1.2-1h3.7c1.5 0 2.7.3 3.6.9.4.3.8.7 1 .9.2.4.3.9.3 1.5 0 .4 0 .8-.1 1.2-1.2 5.3-5.3 7.1-10.3 7.1h-2.5c-.6 0-1.1.4-1.2 1l-.8 4.6h-4.9c-.6 0-1-.6-.9-1.2l3.6-22c.1-.6.6-1 1.2-1h10.9c3.4 0 6.6.9 8.3 2.9-1.7-1.5-4.3-2-7.2-2h-5.7c-.6 0-1.1.4-1.2 1l-1 5.2z"/>
                    </svg>
                    <span className="text-sm font-semibold">PayPal</span>
                  </button>

                  {/* Shopify */}
                  <button
                    type="button"
                    aria-label="Shopify"
                    className="h-10 w-full rounded-[6px] flex items-center justify-center gap-2 bg-[#95BF47] text-black shadow-sm hover:opacity-95 transition-opacity"
                    onClick={() => {
                      const merchId = product?.variants?.nodes?.[0]?.id || product?.id;
                      if (merchId) addAndCheckout(merchId, quantity);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.144-.008-.328-.008-.472-.008-1.137 0-2.473.24-3.449.872-.384.248-.704.56-.96.928-.728-.52-1.688-.848-2.728-.848-2.688 0-4.872 2.184-4.872 4.872 0 2.688 2.184 4.872 4.872 4.872 2.688 0 4.872-2.184 4.872-4.872 0-.2-.008-.392-.024-.584.704-.512 1.248-1.24 1.56-2.088.688.64 1.6 1.032 2.616 1.032 2.048 0 3.704-1.656 3.704-3.704 0-2.048-1.656-3.704-3.704-3.704z" fill="currentColor"/>
                    </svg>
                    <span className="text-sm font-semibold">Shop</span>
                  </button>
                </div>

                {/* Bullet points moved here */}
                {bulletPoints.length > 0 ? (
                  <div className="mt-4 border border-gray-200 rounded-none bg-white p-4">
                    <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
                      {bulletPoints.slice(0, 5).map((b, i) => (
                        <li key={i} className="block">{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-none">
                    <p className="text-yellow-800">No bullet points available for this product</p>
                    <p className="text-yellow-700 text-sm mt-2">Bullet points array: {JSON.stringify(bulletPoints)}</p>
                  </div>
                )}

                {/* Watch Video button moved here */}
                {instructionJpg && (
                  <a 
                    href={instructionJpg} 
                    target="_blank" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mt-4"
                  >
                    <Play className="h-4 w-4" />
                    Watch Product Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accordions with solid light-grey frames, full width */}
        <div className="mt-16 space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="description" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-lg font-medium">{L.description}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div 
                  className="prose prose-neutral max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(product.description || "", {
                      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
                      allowedAttributes: {
                        'a': ['href', 'target'],
                      }
                    })
                  }} 
                />
              </AccordionContent>
            </AccordionItem>

            {instructionJpg || instructionPdf ? (
              <AccordionItem value="instructions" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <h3 className="text-lg font-medium">{L.instructions}</h3>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <div className="flex flex-wrap gap-4">
                    {instructionJpg && (
                      <a href={instructionJpg} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                        <Play className="h-4 w-4" />
                        Watch Product Video
                      </a>
                    )}
                    {instructionPdf && (
                      <a href={instructionPdf} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        PDF Instructions
                      </a>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="technical" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-lg font-medium">{L.technical}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                {bulletPoints.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {bulletPoints.map((point, i) => (
                      <li key={i} className="text-foreground">{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{L.noTechData}</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reviews" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-lg font-medium">{L.reviews}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-medium text-foreground mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {related.slice(0, 4).map((p) => (
                <div key={p.id} className="group block rounded-none border border-black/10 dark:border-white/10 overflow-hidden hover:shadow-sm transition-[box-shadow,transform,border-color] duration-300">
                  <div className="aspect-square bg-black/[.03] dark:bg-white/[.06] relative overflow-hidden">
                    {p.image?.url ? (
                      <Image
                        src={p.image.url}
                        alt={p.image.altText || p.title || ""}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <div className="text-sm font-medium group-hover:underline underline-offset-4">{p.title || ""}</div>
                    {p.price ? (
                      <div className="text-sm opacity-80">{p.price}</div>
                    ) : (
                      <div className="text-sm opacity-80">Price not available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
