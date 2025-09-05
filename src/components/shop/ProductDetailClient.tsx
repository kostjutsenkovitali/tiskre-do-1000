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
  const [showVideo, setShowVideo] = useState(false);
  const [debugInstr, setDebugInstr] = useState(false);
  const [instrOpened, setInstrOpened] = useState(false);

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
    return uniqueImages;
  }, [product]);

  const visibleCount = 6;

  const ensureThumbVisible = (idx: number) => {
    if (idx < thumbStart) setThumbStart(idx);
    else if (idx > thumbStart + (visibleCount - 1))
      setThumbStart(idx - (visibleCount - 1));
  };

  const goTo = (idx: number) => {
    if (showVideo) setShowVideo(false);
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
    en: { backToShop: "Back to Shop", product: "Product", sku: "SKU", inStock: "In stock", outOfStock: "Out of stock", quantity: "Quantity:", addToCart: "Add to Cart", description: "Description", watchVideo: "Watch Product Video", technical: "Technical Parameters", noTechData: "No technical data available.", reviews: "Reviews", instructions: "Instructions" },
    et: { backToShop: "Tagasi poodi", product: "Toode", sku: "SKU", inStock: "Laos", outOfStock: "Läbi müüdud", quantity: "Kogus:", addToCart: "Lisa ostukorvi", description: "Kirjeldus", watchVideo: "Vaata toote videot", technical: "Tehnilised andmed", noTechData: "Tehnilised andmed puuduvad.", reviews: "Arvustused", instructions: "Juhendid" },
    de: { backToShop: "Zurück zum Shop", product: "Produkt", sku: "SKU", inStock: "Auf Lager", outOfStock: "Nicht auf Lager", quantity: "Menge:", addToCart: "In den Warenkorb", description: "Beschreibung", watchVideo: "Produktvideo ansehen", technical: "Technische Daten", noTechData: "Keine technischen Daten verfügbar.", reviews: "Bewertungen", instructions: "Anleitungen" },
    fr: { backToShop: "Retour à la boutique", product: "Produit", sku: "SKU", inStock: "En stock", outOfStock: "Rupture de stock", quantity: "Quantité:", addToCart: "Ajouter au panier", description: "Description", watchVideo: "Regarder la vidéo du produit", technical: "Paramètres techniques", noTechData: "Aucune donnée technique disponible.", reviews: "Avis", instructions: "Guides" },
    fi: { backToShop: "Takaisin kauppaan", product: "Tuote", sku: "SKU", inStock: "Varastossa", outOfStock: "Loppu", quantity: "Määrä:", addToCart: "Lisää koriin", description: "Kuvaus", watchVideo: "Katso tuotteen video", technical: "Tekniset tiedot", noTechData: "Teknisiä tietoja ei saatavilla.", reviews: "Arvostelut", instructions: "Ohjeet" },
    sv: { backToShop: "Tillbaka till butik", product: "Produkt", sku: "SKU", inStock: "I lager", outOfStock: "Slut i lager", quantity: "Antal:", addToCart: "Lägg i varukorgen", description: "Beskrivning", watchVideo: "Titta på produktvideo", technical: "Tekniska parametrar", noTechData: "Inga tekniska data tillgängliga.", reviews: "Recensioner", instructions: "Instruktioner" },
  };

  const L = labels[locale] || labels.en;
  const backHref = shopPath(locale as any);
  
  // Fix bullet points handling for Shopify data structure
  const tryParseJsonArray = (val: unknown): string[] | null => {
    if (typeof val !== "string") return null;
    const s = val.trim();
    if (!(s.startsWith("[") && s.endsWith("]"))) return null;
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean);
      }
    } catch {}
    return null;
  };

  const splitLoose = (s: string): string[] => {
    const trimmed = s.trim();
    // Case like ["a";"b";"c"] or ["a","b","c"] with quotes kept
    if (trimmed.startsWith("[\"") && trimmed.endsWith("\"]")) {
      const inner = trimmed.slice(2, -2);
      return inner.split(/\"\s*[;,]\s*\"/).map((x) => x.trim()).filter(Boolean);
    }
    // Fallback: split by newlines or semicolons (not commas to avoid breaking sentences)
    return trimmed.split(/\r?\n+|;+/).map((x) => x.replace(/^\"|\"$/g, "").trim()).filter(Boolean);
  };

  let bulletPoints: string[] = Array.isArray(product?.bulletPoints)
    ? (() => {
        const arr = (product.bulletPoints as any[]).map((x) => (typeof x === "string" ? x : "")).filter(Boolean);
        // If the array contains a single JSON-like string, expand it
        if (arr.length === 1) {
          const parsed = tryParseJsonArray(arr[0]) || splitLoose(arr[0]);
          return Array.isArray(parsed) ? parsed : arr;
        }
        return arr;
      })()
    : [];
    
  
  // Handle bullet points from metafield if not in product object directly
  if (bulletPoints.length === 0 && product?.bulletPointsMetafield) {
    const mf = product.bulletPointsMetafield;
    // Check if mf has a value property (which is typical for metafields)
    if (mf && typeof mf === "object" && "value" in mf) {
      
      if (typeof mf.value === "string") {
        const parsed = tryParseJsonArray(mf.value) || splitLoose(mf.value);
        bulletPoints.push(...parsed);
      }
    } else if (typeof mf === "string") {
      const parsed = tryParseJsonArray(mf) || splitLoose(mf);
      bulletPoints.push(...parsed);
    } else if (Array.isArray(mf)) {
      bulletPoints.push(...mf.filter((x: any) => typeof x === "string"));
    }
    
  }
    
  // Fix instruction handling for Shopify data structure
  let instructionImages: string[] = [];
  let instructionPdf: string | null = null;
  
  const collectImageUrls = (mf: any) => {
    if (!mf) return;
    // Single reference
    const refUrl = mf?.reference?.image?.url || mf?.reference?.url;
    if (typeof refUrl === "string") instructionImages.push(refUrl);
    // Multiple references
    const nodes: any[] = mf?.references?.nodes || [];
    for (const n of nodes) {
      const url = n?.image?.url || n?.url;
      if (typeof url === "string") instructionImages.push(url);
    }
    // Direct value if it's an http(s) URL
    const val: string | undefined = typeof mf?.value === "string" ? mf.value : undefined;
    if (val && /^https?:\/\//i.test(val)) instructionImages.push(val);
  };
  // Prefer locale-specific metafield, then generic
  collectImageUrls((product as any)?.instructionJpgEn);
  collectImageUrls((product as any)?.instructionJpg);
  // De-duplicate
  instructionImages = Array.from(new Set(instructionImages.filter(Boolean)));
  
  // Resolve instructionPdf from metafield objects
  if (product?.instructionPdfEn?.reference?.url) {
    instructionPdf = product.instructionPdfEn.reference.url;
  } else if (product?.instructionPdf?.reference?.url) {
    instructionPdf = product.instructionPdf.reference.url;
  } else if (product?.instructionPdfEn?.value && !product.instructionPdfEn.value.startsWith('shopify://')) {
    instructionPdf = product.instructionPdfEn.value;
  } else if (product?.instructionPdf?.value && !product.instructionPdf.value.startsWith('shopify://')) {
    instructionPdf = product.instructionPdf.value;
  }
  
  // Get the merchandise ID for payment buttons
  const getMerchandiseId = () => {
    return product?.variants?.nodes?.[0]?.id || product?.id || "";
  };

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
              {(() => {
                const url: string | undefined = (product as any)?.productVideo;
                const isDirect = typeof url === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
                const toEmbedUrl = (u: string): string => {
                  try {
                    const lower = u.toLowerCase();
                    if (lower.includes("youtube.com/watch") || lower.includes("youtu.be/")) {
                      const yt = new URL(u);
                      let id = yt.searchParams.get("v");
                      if (!id && yt.hostname.includes("youtu.be")) id = yt.pathname.slice(1);
                      return id ? `https://www.youtube.com/embed/${id}` : u;
                    }
                    if (lower.includes("vimeo.com/")) {
                      const vm = new URL(u);
                      const id = vm.pathname.split("/").filter(Boolean).pop();
                      return id ? `https://player.vimeo.com/video/${id}` : u;
                    }
                  } catch {}
                  return u;
                };
                if (showVideo && url) {
                  return isDirect ? (
                    <video src={url} controls playsInline className="w-full h-full object-cover" />
                  ) : (
                    <iframe
                      src={toEmbedUrl(url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Product video"
                    />
                  );
                }
                return images.length > 0 ? (
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
                );
              })()}

              {!showVideo && images.length > 1 ? (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center transition-all duration-150 active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center transition-all duration-150 active:scale-95"
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
                      className="w-8 h-8 border border-border rounded-none flex items-center justify-center disabled:opacity-40 transition-all duration-150 active:scale-95"
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
                            } rounded-none overflow-hidden transition-all duration-150 active:scale-95`}
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
                      className="w-8 h-8 border border-border rounded-none flex items-center justify-center disabled:opacity-40 transition-all duration-150 active:scale-95"
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
                {(() => {
                  const vnodes: any[] = (product as any)?.variants?.nodes || [];
                  const skuFromVariant = (vnodes.find((v) => typeof v?.sku === "string" && v.sku.trim().length > 0) || {})?.sku;
                  const skuFromProduct = typeof (product as any)?.sku === "string" ? (product as any).sku : "";
                  const sku = skuFromVariant || skuFromProduct || "—";
                  return <>
                    {L.sku}: {sku}
                  </>;
                })()}
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
                    className="rounded-none active:scale-95 transition-transform duration-150"
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
                    className="rounded-none active:scale-95 transition-transform duration-150"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <AddToCartButton
                  className="w-full h-11 rounded-none bg-gray-900 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform duration-150"
                  variantId={product?.variants?.nodes?.[0]?.id}
                  productId={!product?.variants?.nodes?.length ? product?.id : undefined}
                  quantity={quantity}
                />
                <div className="grid grid-cols-3 gap-3">
                  {/* Google Pay - First button */}
                  <button
                    type="button"
                    aria-label="Google Pay"
                    className="h-10 w-full rounded-none flex items-center justify-center gap-2 bg-black text-white shadow-sm hover:opacity-90 transition-all duration-150 active:scale-95"
                    onClick={() => {
                      const merchId = getMerchandiseId();
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

                  {/* PayPal with official brand style - Second button */}
                  <button
                    type="button"
                    aria-label="PayPal"
                    className="h-10 w-full rounded-none flex items-center justify-center gap-2 bg-[#FFC439] text-[#111111] shadow-sm hover:opacity-95 transition-all duration-150 active:scale-95"
                    onClick={() => {
                      const merchId = getMerchandiseId();
                      if (merchId) addAndCheckout(merchId, quantity);
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 256 308" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#003087" d="M211.6 75.2c-8-9.8-20.8-15.4-37.9-16.6H97.7c-4.8 0-8.9 3.5-9.6 8.2L63 243.6c-.6 4 2.4 7.7 6.6 7.7h35.8l5.6-35.3c.7-4.6 4.7-8 9.4-8h21.2c41.6 0 74.2-16.2 83.8-63.3 4.1-19.8 1.9-35.7-13.8-49.5z"/>
                      <path fill="#0070BA" d="M116.5 96.7c.7-4.6 4.7-8 9.4-8h34c13.6.9 24.4 4.6 31.8 10.5 7.8 6.2 11.1 14.8 9.2 25.4-7.5 39.6-36.8 52.7-74.5 52.7h-15.7c-4.7 0-8.7 3.4-9.4 8l-6.5 40.9H76.3c-4.2 0-7.2-3.7-6.6-7.7l24.5-160.2c.7-4.7 4.8-8.2 9.6-8.2h12.7l-.1.6z"/>
                    </svg>
                    <span className="text-sm font-semibold">PayPal</span>
                  </button>

                  {/* Stripe - Third button */}
                  <button
                    type="button"
                    aria-label="Stripe"
                    className="h-10 w-full rounded-none flex items-center justify-center gap-2 bg-white text-white shadow-sm hover:opacity-95 transition-all duration-150 border border-gray-300 active:scale-95"
                    onClick={() => {
                      const merchId = getMerchandiseId();
                      if (merchId) addAndCheckout(merchId, quantity);
                    }}
                  >
                    <svg width="56" height="24" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M512.6 204.7c-6.6 0-12 5.4-12 12v464.1c0 6.6 5.4 12 12 12h464.1c6.6 0 12-5.4 12-12V216.7c0-6.6-5.4-12-12-12H512.6zm232.1 430.1c-98.8 0-179-80.2-179-179s80.2-179 179-179 179 80.2 179 179-80.2 179-179 179zm0-316c-75.6 0-137 61.4-137 137s61.4 137 137 137 137-61.4 137-137-61.4-137-137-137z" fill="#635BFF"/>
                      <path d="M800 900c-248.5 0-450-201.5-450-450S551.5 0 800 0s450 201.5 450 450-201.5 450-450 450zm0-840c-215.4 0-390 174.6-390 390s174.6 390 390 390 390-174.6 390-390-174.6-390-390-390z" fill="#635BFF"/>
                    </svg>
                    <span className="text-[#635BFF] font-medium">Stripe</span>
                  </button>
                </div>

                {/* Bullet points moved here */}
                {bulletPoints.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-none bg-white p-4">
                    <ul className="list-disc list-outside pl-6 space-y-2 text-sm text-foreground marker:text-black" style={{ listStyleType: "disc" }}>
                      {bulletPoints.map((b, i) => (
                        <li key={i} className="leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Watch Product Video button - moved to be under bullet points container */}
                {product.productVideo && (
                  <button 
                    onClick={() => setShowVideo(!showVideo)}
                    className="mt-4 w-auto px-6 h-11 rounded-none bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 active:scale-95"
                  >
                    <Play className="h-4 w-4 mr-2 inline" />
                    {L.watchVideo}
                  </button>
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
                {false && (() => {
                  const mfEn: any = (product as any)?.instructionJpgEn;
                  const mfGen: any = (product as any)?.instructionJpg;
                  const mfPdfEn: any = (product as any)?.instructionPdfEn;
                  const mfPdf: any = (product as any)?.instructionPdf;
                  const getDetails = (mf: any) => ({
                    type: mf?.type,
                    valuePrefix: typeof mf?.value === 'string' ? mf.value.slice(0, 80) : undefined,
                    hasReferenceUrl: !!mf?.reference?.url,
                    hasReferenceImageUrl: !!mf?.reference?.image?.url,
                    referencesCount: Array.isArray(mf?.references?.nodes) ? mf.references.nodes.length : 0,
                    firstNodeUrl: mf?.references?.nodes?.[0]?.image?.url || mf?.references?.nodes?.[0]?.url,
                  });
                  const dbg = {
                    expectedMetafields: [
                      'custom.instruction_jpg_en',
                      'custom.instruction_jpg',
                      'custom.instruction_pdf_en',
                      'custom.instruction_pdf',
                    ],
                    graphQLSelection: 'metafield { value reference { url image { url } } references { nodes { url image { url } } } }',
                    jpgEn: getDetails(mfEn),
                    jpg: getDetails(mfGen),
                    pdfEn: getDetails(mfPdfEn),
                    pdf: getDetails(mfPdf),
                    resolvedImages: instructionImages,
                    resolvedPdf: instructionPdf,
                  };
                  return (
                    <pre className="mb-4 whitespace-pre-wrap text-xs bg-black/5 p-3 rounded border border-black/10">{JSON.stringify(dbg, null, 2)}</pre>
                  );
                })()}
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

            <AccordionItem value="instructions" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
              <AccordionTrigger className="px-6 py-4 hover:no-underline" onToggle={(open) => setInstrOpened(open)}>
                <h3 className="text-lg font-medium">{L.instructions}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                
                {/* Display instruction images (all) */}
                {instructionImages.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {instructionImages.map((src, i) => (
                      <img key={i} src={src} alt={`Product Instructions ${i+1}`} className="max-w-full h-auto rounded border" />
                    ))}
                    </div>
                  )}

                {/* Display PDF download link if available */}
                {instructionPdf && (
                      <a
                        href={instructionPdf}
                    target="_blank" 
                        download
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors mt-4"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Download PDF Instructions
                  </a>
                )}
                
                {/* If no instruction files are available, show a message */}
                {instructionImages.length === 0 && !instructionPdf && (
                  <p className="text-muted-foreground mt-4">No instructions available for this product.</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technical" className="border border-gray-200 rounded-none bg-[#b8b8a8]">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-lg font-medium">{L.technical}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                {(() => {
                  // Prefer array input for technical parameters. If it's a string, split into separate items.
                  const rawTechValue: any = (product as any)?.technicalParameters?.value;
                  const rawTech: any = typeof rawTechValue !== 'undefined' ? rawTechValue : (product as any)?.technicalParameters;

                  let items: string[] = [];
                  if (Array.isArray(rawTech)) {
                    items = rawTech.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
                  } else if (typeof rawTech === 'string' && rawTech.trim().length > 0) {
                    const s = rawTech.trim();
                    let parsed: string[] | null = null;
                    // Try strict JSON array first
                    if (s.startsWith('[') && s.endsWith(']')) {
                      try {
                        const arr = JSON.parse(s);
                        if (Array.isArray(arr)) {
                          parsed = arr.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
                        }
                      } catch {}
                      // Fallback: bracketed quoted values split
                      if (!parsed) {
                        const inner = s.slice(1, -1);
                        const parts = inner
                          .split(/"\s*,\s*"|"\s*;\s*"/)
                          .map((t) => t.replace(/^\"|\"$/g, '').trim())
                          .filter(Boolean);
                        if (parts.length > 0) parsed = parts;
                      }
                    }

                    if (parsed) {
                      items = parsed;
                    } else {
                      // Generic free-form split by newlines or semicolons
                      const text = s.replace(/\r\n?/g, '\n');
                      items = text
                        .split(/\n+|;\s*/)
                        .map((t) => t.replace(/^[\-•\u2022]\s*/, '').trim())
                        .filter(Boolean);
                    }
                  }

                  if (items.length > 0) {
                    return (
                      <div className="space-y-1 text-base text-foreground">
                        {items.map((p: string, i: number) => {
                          const idx = p.indexOf(':');
                          if (idx >= 0) {
                            const label = p.slice(0, idx).trim();
                            const val = p.slice(idx + 1).trim();
                            return (
                              <div key={i}>
                                <span className="font-medium">{label}:</span>{' '}{val}
                    </div>
                            );
                          }
                          return <div key={i}>{p}</div>;
                        })}
                </div>
                    );
                  }
                  
                  // Fallback to original shipping package and weight display
                  let shippingPackage: string | null = (product as any)?.shippingPackage || null;
                  const spMf: any = (product as any)?.shippingPackageMetafield;
                  if (!shippingPackage && spMf) {
                    if (typeof spMf === "string") shippingPackage = spMf;
                    else if (typeof spMf?.value === "string") shippingPackage = spMf.value;
                    else if (typeof spMf?.reference?.title === "string") shippingPackage = spMf.reference.title;
                  }
                  const v0: any = (product as any)?.variants?.nodes?.[0];
                  const weightStr = v0?.weight ? `${v0.weight} ${v0.weightUnit || ""}`.trim() : "";
                  const hasAny = Boolean(shippingPackage) || Boolean(weightStr);
                  
                  if (hasAny) {
                    return (
                      <dl className="text-sm text-foreground space-y-2">
                        <div><dt className="font-medium inline">Shipping Package:</dt> <dd className="inline">{shippingPackage || "—"}</dd></div>
                        <div><dt className="font-medium inline">Product weight:</dt> <dd className="inline">{weightStr || "—"}</dd></div>
                      </dl>
                    );
                  }
                  
                  // If no technical data available
                  return <p className="text-muted-foreground">{L.noTechData}</p>;
                })()}
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