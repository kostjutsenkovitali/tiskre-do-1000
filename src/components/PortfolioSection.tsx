// src/components/PortfolioSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/contexts/I18nProvider";
import type { CSSProperties } from "react";

/* =========================
   Config
   ========================= */

// Slow the zoom + each horizontal step
const SLOWDOWN = 2;

// Sticky section height (vh)
const PIN_VH = 1060;

const PARALLAX_ROW_INDEX = 0;
const BLUESHIFT_ROW_INDEX = 6;

// Phase budgets (in "virtual vh")
const PAUSE_VH = 15;
const GATHER_VH = 60;
const ZOOM_VH = 80; // base (pre-slowdown)
const FLY_VH = 80;
const EXTRA_FREEZE_VH = 30; // freeze right after Blue ends
const HSHIFT_VH = 100; // base (pre-slowdown)

// Slowed budgets
const ZOOM_VH_SLOW = ZOOM_VH * SLOWDOWN;
const HSHIFT_VH_SLOW = HSHIFT_VH * SLOWDOWN;

// Assets/colors
const SALMON_IMG = "/popular/salmon-1.webp";
const LIGHT_TEAL = "#98a8b8";
const TEAL_TARGET_W_VW = 50;
const SALMON_WIDTH_VW = 40;
const SALMON_START_AT = 0.2;

const FRAME_OAK_IMG = "/popular/frame-oak.png";
const FRAME_RAIL_PX = 128;
const OAK_BADGE_IMG = "/popular/oak.png";

// (still available if you ever need a solid fallback)
const SCENE_BG = "#e9e9e9";

// Gradient for the whole Portfolio section
const SECTION_BG_GRADIENT = "linear-gradient(180deg, #f8f8f8 0%, #f8f8f8 100%)";

// Right-side panels (+ vertical offsets)
const RIGHT_PANELS = [
  { src: "/popular/corten.jpg", alt: "corten", topOffsetPx: 200 }, // ↓ 200px
  { src: "/popular/kamado.jpg", alt: "kamado", topOffsetPx: 250 }, // ↓ 250px
  { src: "/popular/outdoor.jpg", alt: "outdoor", topOffsetPx: 0 },
];
const NUM_RIGHT_PANELS = RIGHT_PANELS.length;

// Flying letters - we'll replace this with a translation
const LETTER_SCALE_START = 10;
const LETTER_SCALE_END = 1;
const LETTER_DELAY = 0.08;
const LETTER_DUR = 0.65;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/* ======= GRID (use your NEW table exactly) ======= */
export const gridFromTable4: string[][] = [
  ["BigOverlapLeftUp", "BigOverlapLeftBottom SmallUnderlyingRightBottomShop(https://tiskre-do.eu/product/new-product/)", "empty"],
  ["SmallOverlapRightBottomShop(https://tiskre-do.eu/product/new-product/)", "SmallOverlapLeftBottom BigUnderlyingRightUp", "SmallUnderlyingLeftBottomShop(https://tiskre-do.eu/product/new-product/) BigOverlapRightBottom"],
  ["SmallOverlapLeftUp BigUnderlyingRightBottom", "BigOverlapLeftUpShop(https://tiskre-do.eu/product/new-product/)", "BigUnderlyingLeftUp SmallOverlapRightBottom"],
  ["BigOverlapLeftUp SmallUnderlyingRightUp", "BigUnderlyingRightBottomShop(https://tiskre-do.eu/product/new-product/) SmallOverlapLeftUp", "SmallOverlapLeftUp BigUnderlyingRightBottom"],
  ["SmallOverlapLeftBottomShop(https://tiskre-do.eu/product/new-product/)", "SmallOverlapLeftUp", "SmallOverlapLeftBottom"],
  ["BigUnderlyingLeftUp SmallOverlapRightBottom", "BigOverlapLeftUp SmallUnderlyingRightUp", "BigOverlapLeftUp"],
  ["BigOverlapRightUp", "BigUnderlyingLeftBottom SmallOverlapRightUp", "BigOverlapLeftUp"],
  ["SmallOverlapLeftBottom", "SmallOverlapLeftBottom", "empty"],
  ["BigOverlapLeftUp SmallUnderlyingRightBottom", "BigUnderlyingLeftUp SmallOverlapRightBottom", "empty"],
];

/* =========================
   Helpers
   ========================= */

function normalizeToken(token: string): string {
  return token
    .replaceAll("Buttomborder", "Bottomborder")
    .replaceAll("BigUndrlying", "BigUnderlying")
    .replaceAll("BigUnderluing", "BigUnderlying")
    .replaceAll("LeftUpborder", "LeftborderUpborder")
    .replaceAll("RightUpborder", "RightborderUpborder")
    .replaceAll("LeftBottom", "LeftborderBottomborder")
    .replaceAll("RightBottom", "RightborderBottomborder")
    .replaceAll("LeftUp", "LeftborderUpborder")
    .replaceAll("RightUp", "RightborderUpborder")
    .replaceAll("LeftBottomborder", "LeftborderBottomborder")
    .replaceAll("RightBottomborder", "RightborderBottomborder")
    .trim();
}

function parseShopSuffix(rawToken: string): { cleanToken: string; shopUrl: string | null } {
  const m = rawToken.match(/Shop\(([^)]+)\)/i);
  const shopUrl = m ? m[1] : null;
  const cleanToken = normalizeToken(rawToken.replace(/Shop\([^)]+\)/i, ""));
  return { cleanToken, shopUrl };
}

/** background stack */
function bgImageStack(size: "Big" | "Small", col: number, row: number): string {
  const base = `/portfolio/${size}${col}${row}`;
  return [`${base}.webp`, `${base}.jpg`, `${base}.png`].map((u) => `url('${u}')`).join(", ");
}

function styleFromDescriptor(descriptor: string): CSSProperties {
  const isBig = descriptor.includes("Big");
  const style: CSSProperties = {
    position: "absolute",
    width: isBig ? "65%" : "45%",
    aspectRatio: "15 / 9",
    zIndex: descriptor.includes("Overlap") ? 10 : 5,
    transition: "transform 0.1s ease-out",
    willChange: "transform",
    overflow: "hidden",
    borderRadius: 0,
    border: "4px solid #d4d4d4",
    boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
  };
  if (descriptor.includes("Leftborder")) style.left = 0;
  if (descriptor.includes("Rightborder")) style.right = 0;
  if (descriptor.includes("Upborder")) style.top = 0;
  if (descriptor.includes("Bottomborder")) style.bottom = 0;
  return style;
}

/* ---------- Tile Layer ---------- */
type FocusedTile = {
  src: string;
  alt: string;
  row: number;
  col: number;
  size: "Big" | "Small";
  shopUrl?: string | null;
};

function TileLayer({
  rawToken,
  colIndex,
  rowIndex,
  parallaxOffsetEffective,
  hoveredId,
  setHoveredId,
  openOverlay,
}: {
  rawToken: string;
  colIndex: number;
  rowIndex: number;
  parallaxOffsetEffective: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  openOverlay: (t: FocusedTile) => void;
}) {
  const { t } = useI18n();
  const { cleanToken, shopUrl } = parseShopSuffix(rawToken);
  const size: "Big" | "Small" = cleanToken.includes("Big") ? "Big" : "Small";
  const col = colIndex + 1;
  const row = rowIndex + 1;

  const tileId = `${row}-${col}-${size}`;
  const speed = size === "Big" ? 0.35 : 1;
  const translateY = -(parallaxOffsetEffective) * speed;
  const isHovered = hoveredId === tileId;

  const bgStack = bgImageStack(size, col, row);

  return (
    <div
      style={{
        ...styleFromDescriptor(cleanToken),
        transform: `translate3d(0, ${translateY}px, 0)`,
        backgroundImage: bgStack,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="group"
      onMouseEnter={() => setHoveredId(tileId)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity"
        style={{
          opacity: isHovered ? 1 : 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.06) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openOverlay({
            src: bgStack,
            alt: `${size} tile ${row}-${col}`,
            row,
            col,
            size,
            shopUrl,
          });
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 font-semibold uppercase text-[0.9rem] shadow-md rounded-md border"
        style={{
          background: "rgba(255,255,255,0.92)",
          color: "#111",
          letterSpacing: "0.04em",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 160ms ease, transform 160ms ease",
          transform: `scale(${isHovered ? 1.02 : 1})`,
          pointerEvents: "auto",
        }}
      >
        {t("Common.viewMore")}
      </button>
    </div>
  );
}

/* =========================
   Component
   ========================= */
export default function PortfolioSection() {
  const { t } = useI18n();
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [scrollRangePx, setScrollRangePx] = useState(1);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [heroPushDown, setHeroPushDown] = useState(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focused, setFocused] = useState<FocusedTile | null>(null);
  const [mounted, setMounted] = useState(false);

  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Esc to close overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const body = document.body;
    if (focused) {
      const prev = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = prev;
      };
    }
  }, [focused]);

  // header height
  useEffect(() => {
    const headerEl = document.querySelector("header");
    const measure = () => {
      if (headerEl) setHeaderHeight((headerEl as HTMLElement).getBoundingClientRect().height || 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // push below hero
  useEffect(() => {
    const measureHeroOverlap = () => {
      const hero = document.querySelector<HTMLElement>('section[aria-label="Hero"]');
      if (!hero) return setHeroPushDown(0);
      const heroRect = hero.getBoundingClientRect();
      const heroTop = heroRect.top + window.scrollY;
      const heroBottom = heroTop + heroRect.height;
      const cards = Array.from(hero.querySelectorAll<HTMLAnchorElement>("a[href]"));
      if (!cards.length) return setHeroPushDown(0);
      const maxCardBottom = Math.max(
        ...cards.map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + r.height + window.scrollY;
        })
      );
      const overlap = Math.max(0, Math.ceil(maxCardBottom - heroBottom));
      setHeroPushDown(overlap + 24);
    };
    const raf = requestAnimationFrame(measureHeroOverlap);
    window.addEventListener("resize", measureHeroOverlap);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureHeroOverlap);
    };
  }, []);

  // scroll listener
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const spacer = spacerRef.current;
        if (!spacer) {
          ticking = false;
          return;
        }
        const startY = spacer.offsetTop;
        const spacerHeight = spacer.offsetHeight;
        const viewport = window.innerHeight;
        const range = Math.max(1, spacerHeight - viewport);
        setScrollRangePx(range);

        const localY = Math.min(Math.max(0, window.scrollY - startY), range);
        setParallaxOffset(localY);

        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ====== Virtual scroll math (in vh) ====== */
  const viewportPx = typeof window !== "undefined" ? window.innerHeight : 0;
  const virtualTopVh = viewportPx ? (parallaxOffset / viewportPx) * 100 : 0;
  const totalVh = viewportPx ? (scrollRangePx / viewportPx) * 100 : 0;
  const rowH = 25;

  // PARALLAX clamp
  const rowStartVh = PARALLAX_ROW_INDEX * rowH;
  const minVh = Math.max(0, rowStartVh - 100);
  const maxVh = Math.max(0, (gridFromTable4.length - 1) * rowH - 100);
  const minPx = (minVh / 100) * viewportPx;
  const maxPx = (maxVh / 100) * viewportPx;
  const parallaxOffsetEffective = Math.min(Math.max(parallaxOffset, minPx), maxPx);

  // content vertical slide
  const contentTranslateY = -parallaxOffset;

  /* ===== Blue fill → PAUSE → Gathering → Zoom → Flying letters → H-Shift ===== */

  const blueStartVh = Math.max(0, BLUESHIFT_ROW_INDEX * rowH - 100);

  // Horizontal budget across all right panels (staged)
  const PER_SEGMENT_VW = 75;                    // distance between consecutive centers
  const TOTAL_SHIFT_VW = PER_SEGMENT_VW * NUM_RIGHT_PANELS; // 0 → Corten ctr → Kamado ctr → Outdoor ctr

  // Tail with slowdown applied to Zoom and horizontal shift
  const TOTAL_HSHIFT_VH_SLOW = HSHIFT_VH_SLOW * NUM_RIGHT_PANELS;
  const tailVhWithPause =
    PAUSE_VH + GATHER_VH + ZOOM_VH_SLOW + FLY_VH + EXTRA_FREEZE_VH + TOTAL_HSHIFT_VH_SLOW;

  const blueEndVh = Math.max(blueStartVh + 1, totalVh - tailVhWithPause);

  // Blue fill lasts 8× scroll distance
  const blueFillProgress =
    (virtualTopVh - blueStartVh) / Math.max(1, (blueEndVh - blueStartVh) * 48);

  const postBlueRaw =
    clamp01((virtualTopVh - blueEndVh) / Math.max(1, tailVhWithPause)) * tailVhWithPause;

  // Freeze then pause
  const afterFreezeVh = Math.max(0, postBlueRaw - EXTRA_FREEZE_VH);
  const afterPauseVh = Math.max(0, afterFreezeVh - PAUSE_VH);

  // Phases
  const gatherP = clamp01(afterPauseVh / GATHER_VH);
  const zoomP = clamp01((afterPauseVh - GATHER_VH) / Math.max(0.0001, ZOOM_VH_SLOW));
  const flyP = clamp01((afterPauseVh - GATHER_VH - ZOOM_VH_SLOW) / Math.max(0.0001, FLY_VH));

  // ----- New staged horizontal mapping (rigid track, constant speed) ----- 
  const afterFlyVh = Math.max(0, afterPauseVh - GATHER_VH - ZOOM_VH_SLOW - FLY_VH);
  const progress01 = clamp01(afterFlyVh / Math.max(0.0001, TOTAL_HSHIFT_VH_SLOW));
  const vwProgress = progress01 * TOTAL_SHIFT_VW;    // 0 → 225vw (for 3 panels)
  const sliderTxVW = -vwProgress;                    // translate track left

  // Visibility gates (off-screen until trigger moments)
  const showKamado = vwProgress >= PER_SEGMENT_VW - 0.001;       // when Corten center hits screen center
  const showOutdoor = vwProgress >= PER_SEGMENT_VW * 2 - 0.001;  // when Kamado center hits screen center

  // Blue transform path (no gathered shift)
  const preZoomShiftPct = blueFillProgress < 1 ? (1 - blueFillProgress) * 100 : 0;
  const blueTxPct = preZoomShiftPct * (1 - zoomP);

  // Gathering transforms
  const tealTx = `translate3d(${(1 - gatherP) * TEAL_TARGET_W_VW}vw, 0, 0)`;
  const p2 = clamp01((gatherP - SALMON_START_AT) / (1 - SALMON_START_AT));
  const salmonStartLeftVW = 100;
  const salmonEndLeftVW = 50 - SALMON_WIDTH_VW / 2;
  const salmonLeft = salmonStartLeftVW + (salmonEndLeftVW - salmonStartLeftVW) * p2;

  // Zoom
  const SCALE_END = 0.5;
  const scale = 1 - (1 - SCALE_END) * zoomP;

  // Slider visibility helper
  const showSlider = virtualTopVh >= blueStartVh - 0.5;

  // Keep for future logic if needed
  const outdoorFullyVisible = vwProgress >= 175;

  // ===== Flying letters setup =====
  const FLY_TEXT = t("Portfolio.masterpieces"); // Use translation instead of hardcoded text
  const letters = Array.from(FLY_TEXT);
  const startOffsets = letters.map((_ch, i) => {
    switch (i) {
      case 0: return { xvw: -110, yvh: 0 };
      case 1: return { xvw: 0, yvh: -120 };
      case 2: return { xvw: 0, yvh: 120 };
      case 3: return { xvw: 0, yvh: -120 };
      case 4: return { xvw: 0, yvh: 120 };
      case 5: return { xvw: 0, yvh: 120 };
      case 6: return { xvw: 0, yvh: 0 };
      case 7: return { xvw: 0, yvh: -120 };
      case 8: return { xvw: 0, yvh: 120 };
      case 9: return { xvw: 0, yvh: -120 };
      case 10: return { xvw: 110, yvh: 0 };
      default: return { xvw: 0, yvh: 0 };
    }
  });

  // Track width: 100vw scene + 3×50vw panels + 2×25vw gaps (between right panels)
  const trackWidthVW = 100 + 50 * NUM_RIGHT_PANELS + 25 * (NUM_RIGHT_PANELS - 1);

  // === Overlay fades based on centers (75vw per stage) ===
  const afterCortenCenter = clamp01((vwProgress - 75) / 75);
  const oakOpacity = 1 - afterCortenCenter;

  // Common font size for right-panel overlays (match "Our most sought...")
  const FLY_FONT_VW = 2.1; // Fixed value for font size
  const OVERLAY_FONT = `${FLY_FONT_VW}vw`;

  // Button style (black background, white text)
  const BTN_STYLE: CSSProperties = {
    display: "inline-block",
    marginTop: "0.35em",
    padding: "0.25em 0.7em",
    fontSize: OVERLAY_FONT,
    borderRadius: 0,
    background: "#000",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    letterSpacing: "0.02em",
    border: "1px solid #000",
  };

  return (
    <div
      ref={spacerRef}
      className="relative"
      style={{ height: `${PIN_VH}vh`, marginTop: heroPushDown }}
    >
      <section
        aria-label="Portfolio (combined)"
        className="sticky top-0 h-screen overflow-hidden isolate"
        // Apply the gradient to the WHOLE section (behind everything)
        style={{ backgroundImage: SECTION_BG_GRADIENT, backgroundColor: "#f8f8f8" }}
      >
        {/* content grid: slides vertically with scroll */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate3d(0, ${contentTranslateY}px, 0)`, willChange: "transform" }}
        >
          {/* Grid ABOVE the slider so hover works */}
          <div className="relative z-20 w-full px-4 py-12">
            <div className="space-y-6">
              {gridFromTable4.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-6" style={{ height: "25vh", position: "relative" }}>
                  {row.map((cell, colIndex) => (
                    <div key={colIndex} className="relative h-full overflow-visible">
                      {/* SPECIAL: row 1, col 3 — image only */}
                      {rowIndex === 0 && colIndex === 2 ? (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: 0,
                            width: "65%",
                            aspectRatio: "15 / 9",
                            borderRadius: 0,
                            border: "4px solid #d4d4d4",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
                            overflow: "hidden",
                            backgroundImage: "url('/portfolio/table13.jpg')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      ) : (
                        <>
                          {cell !== "empty" &&
                            cell
                              .split(" ")
                              .filter(Boolean)
                              .map((rawToken, idx) => (
                                <TileLayer
                                  key={idx}
                                  rawToken={rawToken}
                                  colIndex={colIndex}
                                  rowIndex={rowIndex}
                                  parallaxOffsetEffective={parallaxOffsetEffective}
                                  hoveredId={hoveredId}
                                  setHoveredId={setHoveredId}
                                  openOverlay={(t) => setFocused(t)}
                                />
                              ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Slider track: 100vw scene + right panels (with gaps) ===== */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              width: `${trackWidthVW}vw`,
              display: "flex",
              transform: `translate3d(${sliderTxVW}vw, 0, 0)`,
              // Keep transparent so the section gradient shows through everywhere
              backgroundColor: "transparent",
              willChange: "transform",
              overflow: "hidden",
              zIndex: 1,
              pointerEvents: showSlider ? "auto" : "none",
              opacity: showSlider ? 1 : 0,
              transition: "opacity 120ms linear",
            }}
          >
            {/* LEFT panel (100vw) */}
            <div
              style={{
                width: "100vw",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "transparent",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transformOrigin: "50% 50%",
                  transform: `scale(${scale})`,
                  transition: "transform 60ms linear",
                  willChange: "transform",
                }}
              >
                {/* BLUE */}
                <div
                  className="absolute inset-0"
                  style={{
                    zIndex: 10,
                    backgroundImage: "url('/portfolio/Blue.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transform: `translate3d(${blueTxPct}%, 0, 0)`,
                    transition: "transform 60ms linear",
                    willChange: "transform",
                  }}
                />

                {/* LIGHT TEAL + CTA */}
                <div
                  className="absolute right-0"
                  style={{
                    zIndex: 25,
                    top: 0,
                    width: `${TEAL_TARGET_W_VW}vw`,
                    height: "100%",
                    backgroundColor: LIGHT_TEAL,
                    transform: tealTx,
                    transition: "transform 60ms linear",
                    willChange: "transform",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      marginLeft: "clamp(144px, 20vw, 400px)",
                      opacity: clamp01(gatherP * 1.2),
                      transform: `translateX(calc(${(1 - gatherP) * 8}vw + 1.2vw)) scale(3)`,
                      transformOrigin: "left center",
                      transition: "opacity 60ms linear, transform 60ms linear",
                      pointerEvents: "auto",
                      width: "min(32vw, 520px)",
                      color: "#111",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "clamp(28px, 2.6vw, 46px)",
                        lineHeight: 1.15,
                        fontWeight: 900,
                        color: "#111",
                      }}
                    >
                      {t("Portfolio.coldSmoke")}<br />generator<br />SG-2
                    </h2>
                    <a
                      href="/product/sg-2"
                      style={{
                        display: "inline-block",
                        marginTop: "1rem",
                        padding: "0.9rem 1.6rem",
                        fontSize: "clamp(14px, 1.1vw, 18px)",
                        borderRadius: 0,
                        background: "#111",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    >
                      {t("Portfolio.shopNow")}
                    </a>
                  </div>
                </div>

                {/* SALMON */}
                <img
                  src={SALMON_IMG}
                  alt="popular salmon"
                  className="absolute"
                  style={{
                    zIndex: 40,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: `${SALMON_WIDTH_VW}vw`,
                    height: "auto",
                    left: `${salmonLeft}vw`,
                    transition: "left 60ms linear, opacity 60ms linear",
                    willChange: "left, opacity",
                    opacity: p2 > 0 ? 1 : 0,
                  }}
                />

                {/* OAK FRAME (fades after Corten is centered) */}
                <img
                  src={FRAME_OAK_IMG}
                  alt="oak frame"
                  className="absolute pointer-events-none"
                  style={{
                    zIndex: 48,
                    left: "50%",
                    top: "50%",
                    width: `calc(100% + ${FRAME_RAIL_PX * 2}px)`,
                    height: `calc(100% + ${FRAME_RAIL_PX * 2}px)`,
                    transform: "translate(-50%, -50%)",
                    objectFit: "cover",
                    opacity: zoomP > 0 ? 1 - afterCortenCenter : 0,
                    transition: "opacity 60ms linear",
                    filter: "drop-shadow(0 14px 34px rgba(0,0,0,0.45))",
                  }}
                />
              </div>
            </div>

            {/* RIGHT panels (50vw each) with 25vw gap before panel 1 and 25vw before panel 2 */}
            {RIGHT_PANELS.map((p, i) => {
              const visible = i === 0 ? true : i === 1 ? showKamado : showOutdoor;
              return (
                <div
                  key={i}
                  style={{
                    flex: "0 0 50vw",
                    width: "50vw",
                    height: "100vh",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "transparent", // let the section gradient show
                    marginLeft: i === 0 ? 0 : "25vw", // fixed gap → same distance entire scroll
                    visibility: visible ? "visible" : "hidden",
                  }}
                >
                  <div className="absolute inset-x-0" style={{ top: `${p.topOffsetPx}px`, bottom: 0 }}>
                    <img
                      src={p.src}
                      alt={p.alt}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                    />
                  </div>

                  {/* ===== Overlay text + buttons (same font size) ===== */}
                  {i === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        right: "4vw",
                        top: "64%", // one line down (Corten)
                        transform: "translateY(-50%)",
                        textAlign: "right",
                        color: "#111",
                        background: "transparent",
                        pointerEvents: "auto",
                        lineHeight: 1.05,
                      }}
                    >
                      <div style={{ fontSize: OVERLAY_FONT, fontWeight: 900 }}>
                        {t("Portfolio.outdoorGrillTable")}
                      </div>
                      {/* two blank lines */}
                      <div style={{ height: "2em" }} />
                      {/* single button, black/white */}
                      <a href="/shop" style={BTN_STYLE}>
                        {t("Portfolio.shopNow")}
                      </a>
                    </div>
                  )}

                  {i === 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "12vh", // 1 line up from the previous "closer to bottom"
                        transform: "translateX(-50%)",
                        textAlign: "center",
                        color: "#111",
                        background: "transparent",
                        pointerEvents: "auto",
                        lineHeight: 1.05,
                      }}
                    >
                      <div style={{ fontSize: OVERLAY_FONT, fontWeight: 900 }}>
                        {t("Portfolio.kamadoOffRoad")}
                      </div>
                      <a href="/shop" style={BTN_STYLE}>{t("Portfolio.shopNow")}</a>
                    </div>
                  )}

                  {i === 2 && (
                    <div
                      style={{
                        position: "absolute",
                        right: "4vw",
                        top: "64%", // one line down (Outdoor)
                        transform: "translateY(-50%)",
                        textAlign: "right",
                        color: "#111",
                        background: "transparent",
                        pointerEvents: "auto",
                        lineHeight: 1.05,
                      }}
                    >
                      <div style={{ fontSize: OVERLAY_FONT, fontWeight: 900 }}>
                        {t("Portfolio.dreamOutdoorKitchen")}
                      </div>
                      <a href="/shop" style={BTN_STYLE}>{t("Portfolio.shopNow")}</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Top-left overlays ===== */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* oak.png: 100px lower during flying letters */}
          <img
            src={OAK_BADGE_IMG}
            alt="oak"
            style={{
              position: "absolute",
              left: 16,
              top: 116, // 16 + 100px
              width: "min(18vw, 260px)",
              height: "auto",
              opacity: easeOutCubic(flyP),
              transition: "opacity 60ms linear",
            }}
          />
        </div>

        {/* ===== Flying Letters (fixed above; do not scroll away) ===== */}
        <div
          className="pointer-events-none absolute inset-x-0 z-50"
          style={{ top: headerHeight + 8, height: `calc(100vh - ${headerHeight}px - 8px)` }}
          aria-hidden
        >
          {(() => {
            const maxProgressEnd = letters.reduce((max, _ch, i) => {
              const delay = i * LETTER_DELAY;
              const dur = i >= letters.length - 4 ? LETTER_DUR + 0.15 : LETTER_DUR;
              return Math.max(max, delay + dur);
            }, 0);
            const scaledFlyP = flyP * maxProgressEnd;

            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "baseline",
                  gap: "0.02em",
                  lineHeight: 1,
                  color: "#111",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  marginTop: `${FLY_FONT_VW}vw`,
                }}
              >
                {letters.map((ch, i) => {
                  const delay = i * LETTER_DELAY;
                  const dur = i >= letters.length - 4 ? LETTER_DUR + 0.15 : LETTER_DUR;
                  const t = clamp01((scaledFlyP - delay) / dur);
                  const e = easeOutCubic(t);
                  const { xvw, yvh } = startOffsets[i] || { xvw: 0, yvh: 0 };
                  const dx = (1 - e) * xvw;
                  const dy = (1 - e) * yvh;
                  const scaleLetter =
                    LETTER_SCALE_START - (LETTER_SCALE_START - LETTER_SCALE_END) * e;

                  const style: CSSProperties = {
                    fontSize: `${FLY_FONT_VW}vw`,
                    transform: `translate(${dx}vw, ${dy}vh) scale(${scaleLetter})`,
                    transition: "transform 60ms linear, opacity 60ms linear",
                    opacity: ch === " " ? e : t > 0 ? 1 : 0,
                    display: "inline-block",
                  };
                  return (
                    <span key={i} style={style}>
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* === Overlay (portal) === */}
      {mounted &&
        focused &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFocused(null)} />
            <div
              className="relative shadow-2xl"
              style={{
                width: "80vw",
                aspectRatio: "15 / 9",
                borderRadius: 14,
                backgroundImage: focused.src,
                backgroundSize: "cover",
                backgroundPosition: "center",
                overflow: "hidden",
              }}
            >
              <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex gap-3" style={{ pointerEvents: "auto" }}>
                {focused.shopUrl ? (
                  <a
                    href={focused.shopUrl}
                    className="px-5 py-2 font-semibold uppercase text-sm shadow-md rounded-md border"
                    style={{ background: "rgba(255,255,255,0.92)", color: "#111", letterSpacing: "0.05em" }}
                  >
                    {t("Portfolio.shopNow")}
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setFocused(null)}
                  className="px-5 py-2 font-semibold uppercase text-sm shadow-md rounded-md border"
                  style={{ background: "rgba(17,17,17,0.9)", color: "#fff", letterSpacing: "0.05em" }}
                >
                  {t("Portfolio.close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}