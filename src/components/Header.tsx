// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import ThreeModel from "@/components/ThreeModel";

// removed three.js debug imports

/* =========================
   Shared UI styles
   ========================= */
const baseCaps = "font-raleway uppercase tracking-[0.24em]";
const navItemClass = (active: boolean) =>
  [
    // NOTE: keep menu item size the same (py-1.5)
    "px-3 py-1.5 text-[14px] leading-5 rounded-md border transition-colors",
    baseCaps,
    active
      ? "text-black/90 dark:text-white bg-black/[0.06] dark:bg-white/[0.10] border-black/20 dark:border-white/30"
      : "text-black/60 dark:text-white/60 border-black/10 dark:border-white/15 hover:text-black/85 dark:hover:text-white/85 hover:bg-black/[0.12] dark:hover:bg-white/[0.18] hover:border-black/25 dark:hover:border-white/35",
  ].join(" ");

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cartData = useCart();
  const { count, total } = cartData ?? { count: 0, total: 0 };

  const isHomePath = pathname === "/" || pathname === "/home";

  const languages = useMemo(
    () => [
      { code: "en", name: "ENGLISH", flag: "/united-kingdom-728_256.gif" },
      { code: "et", name: "EESTI", flag: "/estonia-363_256.gif" },
      { code: "fi", name: "SUOMI", flag: "/finland-369_256.gif" },
      { code: "fr", name: "FRANÇAIS", flag: "/france-370_256.gif" },
      { code: "de", name: "DEUTSCH", flag: "/germany-382_256.gif" },
      { code: "sv", name: "SVENSKA", flag: "/sweden-698_256.gif" },
    ],
    []
  );

  const currentLangCode = (searchParams?.get("lang") || "en").toLowerCase();
  const currentLang =
    languages.find((l) => l.code === currentLangCode) || languages[0];

  const nav = [
    { href: "/", label: "Home", isActive: isHomePath },
    { href: "/shop", label: "Shop", isActive: pathname?.startsWith("/shop") },
    { href: "/about", label: "About", isActive: pathname?.startsWith("/about") },
    { href: "/instructions", label: "Instructions", isActive: pathname?.startsWith("/instructions") },
    { href: "/contact", label: "Contact", isActive: pathname?.startsWith("/contact") },
    { href: "/blog", label: "Blog", isActive: pathname?.startsWith("/blog") },
  ];

  const langRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = langRef.current;
      if (!el) return;
      if (el.hasAttribute("open") && !el.contains(e.target as Node)) {
        el.removeAttribute("open");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") langRef.current?.removeAttribute("open");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const closeLangMenu = () => langRef.current?.removeAttribute("open");

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/60 dark:bg-black/40 border-b border-black/10 dark:border-white/10 shadow-sm"
        aria-label="Site header"
      >
        {/* Reduced vertical padding to shrink total height */}
        <div className="w-full px-3 py-1 flex items-center justify-between">
          {/* Logo (unchanged size) */}
          <Link href="/" aria-label="Home" className="inline-flex items-center">
            <div className="h-16 sm:h-18 w-[360px] relative">
              <ThreeModel
                modelPath="/hexagon/hextext.glb"
                height="100%"
                align="center"
                fitPadding={0.8}
                background={null}
              />
            </div>
          </Link>

          {/* Nav (unchanged item sizes; slightly tighter gap) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClass(Boolean(item.isActive))}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions (keep controls same size; slightly tighter gap) */}
          <div className="flex items-center gap-1.5">
            {/* Language dropdown */}
            <details ref={langRef} className="relative">
              <summary
                className={[
                  navItemClass(false),
                  "list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden",
                ].join(" ")}
              >
                {currentLang.name}
              </summary>

              <div className="absolute right-0 mt-1 min-w-56 rounded-md border border-black/10 dark:border-white/15 bg-white/95 dark:bg-neutral-900/95 shadow-lg backdrop-blur p-2">
                <ul className="max-h-[60vh] overflow-auto">
                  {languages.map((lang) => {
                    const href =
                      (isHomePath ? "/home" : pathname || "/") +
                      "?" +
                      new URLSearchParams({
                        ...(Object.fromEntries(searchParams?.entries() ?? [])),
                        lang: lang.code,
                      }).toString();

                    return (
                      <li key={lang.code}>
                        <Link
                          href={href}
                          onClick={closeLangMenu}
                          className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-black/[0.12] dark:hover:bg-white/[0.18]"
                        >
                          <img
                            src={lang.flag}
                            alt={`${lang.name} flag`}
                            className="h-5 w-auto"
                            loading="lazy"
                          />
                          <span
                            className={[
                              baseCaps,
                              "text-[12px] tracking-[0.20em] text-black/80 dark:text-white/85",
                            ].join(" ")}
                          >
                            {lang.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>

            {/* Account (unchanged size) */}
            <Link href="/account" aria-label="Account" className="inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className={[
                  "h-9 w-9 rounded-md border-2",
                  "border-black/50 dark:border-white/60",
                  "hover:bg-black/[0.12] dark:hover:bg-white/[0.18]",
                ].join(" ")}
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart (unchanged size) */}
            <Link
              href="/cart"
              aria-label="Open cart"
              className={[
                "inline-flex items-center gap-2 px-3 h-9 rounded-md border-2",
                "border-black/50 dark:border-white/60",
                "hover:bg-black/[0.12] dark:hover:bg-white/[0.18]",
              ].join(" ")}
            >
              <Image
                src="/Cart.png"
                alt="Cart"
                width={20}
                height={20}
                draggable={false}
                className="h-5 w-5 object-contain"
              />
              <span
                className={[
                  baseCaps,
                  "text-[12px] sm:text-[13px] text-black/80 dark:text-white/80",
                ].join(" ")}
              >
                {typeof total === "number"
                  ? new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 2,
                    }).format(total)
                  : "€0.00"}
              </span>
              {count > 0 && (
                <span className="ml-1 text-[11px] tabular-nums text-black/60 dark:text-white/60">
                  ({count})
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile nav — keep item size, reduce bottom padding to tighten total height */}
        <div className="lg:hidden px-3 pb-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { href: "/", label: "Home", isActive: pathname === "/" || pathname === "/home" },
              { href: "/shop", label: "Shop", isActive: pathname?.startsWith("/shop") },
              { href: "/about", label: "About", isActive: pathname?.startsWith("/about") },
              { href: "/instructions", label: "Instructions", isActive: pathname?.startsWith("/instructions") },
              { href: "/contact", label: "Contact", isActive: pathname?.startsWith("/contact") },
              { href: "/blog", label: "Blog", isActive: pathname?.startsWith("/blog") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClass(Boolean(item.isActive))}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
