"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import AddToCartButton from "@/components/AddToCartButton";
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
} from "lucide-react";
type Product = any;
import RelatedProducts from "@/components/shop/RelatedProducts";
import { shopPath } from "@/lib/paths";

type Props = {
  locale: string;
  product: Product;
  related: Product[];
};

function sanitizePrice(htmlish: string): string {
  return htmlish.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function ProductDetailClient({ locale, product, related }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  const images = useMemo(() => {
    const list = [
      product.image?.sourceUrl,
      ...((product.galleryImages?.nodes?.map((n: { sourceUrl?: string }) => n.sourceUrl).filter(Boolean) ||
        []) as string[]),
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
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

  const displayPrice = sanitizePrice(
    product.price ?? product.salePrice ?? product.regularPrice ?? ""
  );

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
  const bulletPoints: string[] = Array.isArray(product?.bulletPoints)
    ? (product.bulletPoints as string[]).filter((x) => typeof x === "string")
    : [];
  const instructionJpg: string | null = product?.instructionJpg || null;
  const instructionPdf: string | null = product?.instructionPdf || null;

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
              {images[0] ? (
                <Image
                  src={images[selectedImage] ?? images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : null}

              {images.length > 1 ? (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background border border-border rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                    {images
                      .slice(thumbStart, thumbStart + visibleCount)
                      .map((image, index) => {
                        const absoluteIndex = thumbStart + index;
                        const isActive = absoluteIndex === selectedImage;
                        return (
                          <button
                            key={image + absoluteIndex}
                            onClick={() => goTo(absoluteIndex)}
                            className={`aspect-square w-full border ${
                              isActive
                                ? "border-black"
                                : "border-border hover:border-black/40"
                            } rounded-none overflow-hidden`}
                            aria-label={`Select image ${absoluteIndex + 1}`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} ${absoluteIndex + 1}`}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          </button>
                        );
                      })}
                  </div>

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
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-1">
                {L.sku}: {product.sku || "—"}
              </p>
              <p className="text-sm mb-4">
                {product.stockStatus === "IN_STOCK" ? (
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
                {product?.variants?.nodes?.[0]?.id ? (
                  <AddToCartButton
                    className="w-full rounded-none"
                    variantId={product.variants.nodes[0].id}
                  />
                ) : (
                  <Button className="w-full rounded-none" disabled>
                    {L.addToCart}
                  </Button>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" size="sm" className="text-xs rounded-none">
                    Google Pay
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-none">
                    PayPal
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-none">
                    Klarna
                  </Button>
                </div>

                {bulletPoints.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-none bg-white p-4">
                    <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                      {bulletPoints.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accordions with solid light-grey frames, full width */}
        <div className="mt-16 w-full">
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem
              value="description"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                {L.description}
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="video"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                <div className="flex items-center">
                  <Play className="h-4 w-4 mr-2" /> {L.watchVideo}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                {images.length > 0 ? (
                  <div className="grid gap-3">
                    {images.find((u: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(u)) ? (
                      <video
                        className="w-full aspect-video border border-gray-200 rounded-none"
                        src={images.find((u: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(u)) as string}
                        controls
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">No video found.</div>
                    )}
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="technical"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                {L.technical}
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {L.noTechData}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="instructions"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                {L.instructions}
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <div className="space-y-4 text-sm text-muted-foreground">
                  {instructionJpg ? (
                    <div className="border border-gray-200 rounded-none bg-white p-2">
                      <Image src={instructionJpg} alt="Instruction" width={1200} height={1600} className="w-full h-auto object-contain" />
                    </div>
                  ) : (
                    <p>No instructions available.</p>
                  )}

                  {instructionPdf ? (
                    <div>
                      <a
                        href={instructionPdf}
                        download
                        className="inline-block px-4 py-2 border border-gray-300 rounded-none text-foreground hover:bg-gray-50"
                      >
                        Download PDF
                      </a>
                    </div>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="reviews"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                {L.reviews} ({mockReviews.length})
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <div className="space-y-4">
                  {mockReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < review.rating
                                  ? "text-black"
                                  : "text-muted-foreground"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Related products (max 4) */}
        <RelatedProducts products={related.slice(0, 4)} hrefBase={backHref} />
      </div>
    </div>
  );
}
