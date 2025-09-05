"use client";

import Link from "next/link";
import Image from "next/image";
import { HeroCategoryName } from "@/components/HeroCategoryName"; // Import the client component for category names
import { HeroViewMoreText } from "@/components/HeroViewMoreText"; // Import the client component for "View more" text
import { usePathname } from "next/navigation";
import { shopPath, detectLocaleFromPath } from "@/lib/paths";

type Category = {
  name: string;
  slug: string;
  // Some WP/Woo setups use different keys – we normalize below.
  description?: string | null;
  // Optional extra fields that sometimes hold a description (we won't depend on them,
  // but we'll read them if present so this component can fix missing data without
  // touching your data layer).
  yoast_head_json?: { og_description?: string } | null;
  seo?: { metaDesc?: string } | null;
  acf?: { description?: string } | null;
  excerpt?: string | null;
};

type Props = { categories?: Category[] };

// Fixed order: which category goes into each card.
const TARGETS = [
  { slug: "corten-products",  image: "/hero-image1.webp",  fallbackName: "Corten Products" },
  { slug: "kamado-carts",     image: "/hero-image2.webp",  fallbackName: "Kamado Carts" },
  { slug: "smokers",          image: "/hero-image3.webp",  fallbackName: "Smokers" },
  { slug: "outdoor-kitchens", image: "/hero-image4.webp",  fallbackName: "Outdoor Kitchens" },
];

// Try hard to get a description even if the fetch didn't include `description`.
function normalizeDescription(cat?: Category | null): string {
  if (!cat) return "";
  const d =
    cat.description?.toString().trim() ||
    cat.seo?.metaDesc?.toString().trim() ||
    cat.yoast_head_json?.og_description?.toString().trim() ||
    cat.acf?.description?.toString().trim() ||
    cat.excerpt?.toString().trim() ||
    "";
  return d;
}

// Find by slug first; if not found, fall back to case-insensitive name match.
function findCategory(pool: Category[], wantedSlug: string, fallbackName: string): Category | null {
  const bySlug =
    pool.find((c) => (c.slug || "").toLowerCase() === wantedSlug.toLowerCase()) || null;
  if (bySlug) return bySlug;

  const byName =
    pool.find((c) => (c.name || "").toLowerCase() === fallbackName.toLowerCase()) || null;
  return byName;
}

export function HeroSection({ categories = [] }: Props) {
  const pathname = usePathname();
  const locale = detectLocaleFromPath(pathname);
  const localizedShopPath = shopPath(locale);

  const cards = TARGETS.map((t) => {
    const cat = findCategory(categories, t.slug, t.fallbackName);
    const name = cat?.name ?? t.fallbackName;
    const descHtml = normalizeDescription(cat); // may be empty if your API truly doesn't send any description
    const href = cat ? `${localizedShopPath}/category/${cat.slug}` : localizedShopPath;
    return { name, descHtml, href, image: t.image, slug: cat?.slug ?? t.slug };
  });

  return (
    <section
      aria-label="Hero"
      className="relative w-full"
      style={{ height: "70vh", marginTop: 0 }}
    >
      {/* Optional background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/hero-background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Row of 4 cards, centered near the bottom */}
      <div className="absolute left-1/2 top-[80%] -translate-x-1/2 flex gap-6">
        {cards.map((card, i) => (
          <Link
            key={i}
            href={card.href}
            style={{ ["--card-w" as any]: "16vw" }}
            className={[
              // Size/layout
              "group relative block w-[var(--card-w)] h-[calc(var(--card-w)*1.35)]",
              // THICK LIGHT-GREY SQUARE FRAME (container only, no rounding here)
              "border-[6px] border-neutral-200 bg-white",
              // Shadow + hover grow
              "shadow-[0_14px_40px_rgba(0,0,0,0.16)]",
              "transform-gpu origin-top transition-transform duration-300 ease-out",
              "hover:scale-[1.10] hover:-translate-y-1",
              "z-0 hover:z-50 focus-visible:z-50 overflow-visible",
            ].join(" ")}
          >
            <article className="h-full w-full grid grid-rows-[1fr_auto_auto]">
              {/* IMAGE (square, no blur, square corners) */}
              <div className="relative w-full aspect-square overflow-hidden bg-neutral-200">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 1024px) 40vw, 16vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>

              {/* NAME with small fitted frame behind text (very light grey bg) */}
              <div className="px-3 pt-2 flex items-center justify-center">
                <span className="inline-block bg-neutral-100 text-center px-3 py-1">
                  <h3 className="text-neutral-900 text-[1.05rem] font-semibold leading-tight whitespace-nowrap">
                    {/* Use client component for translated category name */}
                    <HeroCategoryName slug={card.slug} defaultName={card.name} />
                  </h3>
                </span>
              </div>

              {/* DESCRIPTION + CTA (centered) */}
              <div className="px-3 pb-3 pt-1 text-center">
                {card.descHtml ? (
                  <p
                    className="text-sm text-neutral-700 leading-snug line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: card.descHtml }}
                  />
                ) : (
                  // Keep height stable when there is no description string available.
                  <p className="text-sm text-neutral-500 leading-snug line-clamp-2">&nbsp;</p>
                )}

                {/* CTA → letter-spacing widens ONLY when hovering this text */}
                <span
                  className={[
                    "mt-3 inline-flex items-center gap-2",
                    "text-[0.9rem] font-semibold text-neutral-900 uppercase",
                    "transition-[letter-spacing] duration-200",
                    "hover:tracking-[0.18em]",
                  ].join(" ")}
                >
                  {/* Use client component for translated "View more" text */}
                  <HeroViewMoreText />
                  <span className="inline-flex items-center justify-center w-8 h-8 border border-neutral-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12h14M13 5l7 7-7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}