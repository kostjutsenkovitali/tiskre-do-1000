"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
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
import { Product } from "@/lib/wpData";
import RelatedProducts from "@/components/shop/RelatedProducts";

type Props = {
  product: Product;
  related: Product[];
};

function sanitizePrice(htmlish: string): string {
  return htmlish.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function ProductDetailClient({ product, related }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  const images = useMemo(() => {
    const list = [
      product.image?.sourceUrl,
      ...(product.galleryImages?.nodes?.map((n) => n.sourceUrl).filter(Boolean) ||
        []),
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/shop"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
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
                Product
              </Badge>
              <h1 className="text-3xl font-medium text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-1">
                SKU: {product.sku || "—"}
              </p>
              <p className="text-sm mb-4">
                {product.stockStatus === "IN_STOCK" ? (
                  <span className="text-green-700">In stock</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </p>
              <p className="text-2xl font-medium text-foreground mb-6">
                {displayPrice}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Quantity:</span>
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
                <Button
                  className="w-full rounded-none"
                  onClick={() =>
                    alert(`Added ${quantity} x ${product.name} to cart!`)
                  }
                >
                  Add to Cart
                </Button>
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
                Description
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
                  <Play className="h-4 w-4 mr-2" /> Watch Video
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <div className="aspect-video border border-gray-200 rounded-none overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/ou4FN92d0l8?start=245"
                    title="Product video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="technical"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                Technical Parameters
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 border-t border-gray-200 rounded-none bg-white">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    No technical data available.
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="reviews"
              className="w-full border border-gray-200 rounded-none"
            >
              <AccordionTrigger className="px-4 py-3 w-full rounded-none bg-white hover:bg-gray-50 text-left">
                Reviews ({mockReviews.length})
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
        <RelatedProducts products={related.slice(0, 4)} />
      </div>
    </div>
  );
}
