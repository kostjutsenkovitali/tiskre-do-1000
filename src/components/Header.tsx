// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import ThreeModel, { ThreeModelHandle } from "@/components/ThreeModel";
import { bus } from "@/utils/visibilityBus";
import { blogPath, detectLocaleFromPath, shopPath } from "@/lib/paths";
import { segments } from "@/i18n/config";
import * as THREE from "three";

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
  const router = useRouter();
  const modelRef = useRef<ThreeModelHandle | null>(null);
  const flightRef = useRef<{ running: boolean }>({ running: false });
  const logoObjRef = useRef<THREE.Object3D | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const { count } = useCart();

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

  const currentLangCode = detectLocaleFromPath(pathname).toLowerCase();
  const currentLang =
    languages.find((l) => l.code === currentLangCode) || languages[0];

  const locale = detectLocaleFromPath(pathname);
  const shopHref = shopPath(locale);
  const blogHref = blogPath(locale);
  const aboutHref = `/${locale}/about`;
  const instructionsHref = `/${locale}/instructions`;
  const navLabels: Record<string, { home: string; shop: string; about: string; instructions: string; contact: string; blog: string }> = {
    en: { home: "Home", shop: "Shop", about: "About", instructions: "Instructions", contact: "Contact", blog: "Blog" },
    et: { home: "Avaleht", shop: "Pood", about: "Meist", instructions: "Juhendid", contact: "Kontakt", blog: "Blogi" },
    de: { home: "Startseite", shop: "Shop", about: "Über uns", instructions: "Anleitungen", contact: "Kontakt", blog: "Blog" },
    fr: { home: "Accueil", shop: "Boutique", about: "À propos", instructions: "Guides", contact: "Contact", blog: "Blog" },
    fi: { home: "Etusivu", shop: "Kauppa", about: "Meistä", instructions: "Ohjeet", contact: "Yhteystiedot", blog: "Blogi" },
    sv: { home: "Hem", shop: "Butik", about: "Om oss", instructions: "Instruktioner", contact: "Kontakt", blog: "Blogg" },
  };
  const L = navLabels[locale] || navLabels.en;
  const nav = [
    { href: `/${locale}`, label: L.home, isActive: isHomePath },
    { href: shopHref, label: L.shop, isActive: pathname?.startsWith(shopHref) },
    { href: aboutHref, label: L.about, isActive: pathname?.startsWith("/about") },
    { href: instructionsHref, label: L.instructions, isActive: pathname?.startsWith("/instructions") },
    { href: `/${locale}/contact`, label: L.contact, isActive: pathname?.startsWith(`/${locale}/contact`) },
    { href: blogHref, label: L.blog, isActive: pathname?.startsWith(blogHref) },
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

  // Drive header GLB animation from Hexagon visibility
  useEffect(() => {
    const onEnter = () => { modelRef.current?.setSpeed(1.0); modelRef.current?.play(); };
    const onLeave = () => { modelRef.current?.stop(); };
    const onResetFlight = () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      const obj = logoObjRef.current;
      if (obj) {
        obj.position.set(-1.2, 0.15, 0); // resting pose near logo
        obj.rotation.set(0, 0, 0);
        obj.scale.set(1, 1, 1);
      }
      flightRef.current.running = false;
    };
    function resolveLogoObject(): THREE.Object3D | null {
      const scene = modelRef.current?.getScene?.();
      const byName = scene?.getObjectByName("hexblack-1") as THREE.Object3D | undefined;
      if (byName) return byName;
      if (scene) {
        let g = scene.getObjectByName("logoFlightProxy") as THREE.Group | null;
        if (!g) {
          g = new THREE.Group();
          g.name = "logoFlightProxy";
          g.position.set(-1.2, 0.15, 0);
          scene.add(g);
        }
        return g;
      }
      return null;
    }

    const onFly = () => {
      if (flightRef.current.running) return;
      const obj = (logoObjRef.current ||= resolveLogoObject());
      if (!obj) { requestAnimationFrame(onFly); return; }
      flightRef.current.running = true;
      // Attach to DOM via CSS-driven overlay; since header GLB is rendered by ThreeModel, we simulate flight in CSS-free space by animating transforms on the model container if needed.
      // Here we animate an internal object; consumers can render it as part of the GLB if exposed.
      const start = { x: obj.position.x, y: obj.position.y, z: obj.position.z, sx: 1, sy: 1, sz: 1 };
      const target = { x: 0.0, y: 0.1, z: -0.6, sx: 1.15, sy: 1.15, sz: 1.15 };
      const ease = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; // cubic in/out
      const startAt = performance.now();
      const step = (ts: number) => {
        const t = Math.min(1, (ts - startAt) / 3000);
        const k = ease(t);
        obj.position.set(
          start.x + (target.x - start.x) * k,
          start.y + (target.y - start.y) * k,
          start.z + (target.z - start.z) * k
        );
        obj.scale.set(
          start.sx + (target.sx - start.sx) * k,
          start.sy + (target.sy - start.sy) * k,
          start.sz + (target.sz - start.sz) * k
        );
        if (t < 1 && flightRef.current.running) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          flightRef.current.running = false;
          rafIdRef.current = null;
          bus.emit("header:logo-flyToHex:done");
        }
      };
      rafIdRef.current = requestAnimationFrame(step);
    };
    const offEnter = bus.on("hexagon:enter", onEnter);
    const offLeave = bus.on("hexagon:leave", onLeave);
    const offFly = bus.on("header:logo-flyToHex", onFly);
    const offReset = bus.on("header:resetLogoFlight", onResetFlight);
    return () => {
      offEnter();
      offLeave();
      offFly();
      offReset();
    };
  }, []);

  const closeLangMenu = () => langRef.current?.removeAttribute("open");

  // Language switch handler: preserves path, query, hash; remaps shop/blog slugs when needed
  const onChangeLocale = (nextLocale: string) => {
    try {
      const currentHash = typeof window !== "undefined" ? window.location.hash : "";
      const qs = searchParams ? searchParams.toString() : "";
      const parts = (pathname || "/").split("/").filter(Boolean);
      // Replace locale segment (index 0)
      if (parts.length === 0) {
        parts.push(nextLocale);
      } else {
        parts[0] = nextLocale;
      }

      // If inside shop/blog, remap the second segment to the target locale's slug
      const allShop = new Set<string>(Object.values(segments.shop));
      const allBlog = new Set<string>(Object.values(segments.blog));
      if (parts.length >= 2) {
        if (allShop.has(parts[1])) {
          parts[1] = segments.shop[nextLocale as keyof typeof segments.shop];
        } else if (allBlog.has(parts[1])) {
          parts[1] = segments.blog[nextLocale as keyof typeof segments.blog];
        }
      }

      const targetPath = `/${parts.join("/")}` + (qs ? `?${qs}` : "") + currentHash;

      // Remember selection
      if (typeof document !== "undefined") {
        document.cookie = `NEXT_LOCALE=${nextLocale}; Max-Age=${60 * 60 * 24 * 365}; Path=/`;
      }

      router.push(targetPath);
    } catch {
      // Fallback to localized home if anything goes wrong
      router.push(`/${nextLocale}`);
    }
  };

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
              <ThreeModel ref={modelRef} src="/hexagon/hextext.glb" height="100%" flat scale={0.96} />
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
                  {languages.map((lang) => (
                    <li key={lang.code}>
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onChangeLocale(lang.code);
                          closeLangMenu();
                        }}
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
                  ))}
                </ul>
              </div>
            </details>

            {/* Account (unchanged size) */}
            <Link href={`/${locale}/account`} aria-label="Account" className="inline-flex">
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
              <span className={[baseCaps, "text-[12px] sm:text-[13px] text-black/80 dark:text-white/80"].join(" ")}>Cart</span>
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
              { href: `/${locale}`, label: L.home, isActive: pathname === `/${locale}` },
              { href: shopHref, label: L.shop, isActive: pathname?.startsWith(shopHref) },
              { href: aboutHref, label: L.about, isActive: pathname?.startsWith("/about") },
              { href: instructionsHref, label: L.instructions, isActive: pathname?.startsWith("/instructions") },
              { href: `/${locale}/contact`, label: L.contact, isActive: pathname?.startsWith(`/${locale}/contact`) },
              { href: blogHref, label: L.blog, isActive: pathname?.startsWith(blogHref) },
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