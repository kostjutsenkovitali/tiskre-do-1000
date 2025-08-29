// src/components/TestimoniesAbout.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import ThreeModel from "@/components/ThreeModel";

type Dir = "left" | "right";

/* =========================
   Visual + layout constants
========================= */
const LIGHT_GREY = "#e5e7eb";

/* Card geometry (external) */
const CARD_W_VW = 28;
const GAP_VW = 3;
const SPACING_VW = CARD_W_VW + GAP_VW;

/* Card geometry (internal 22×15 grid) */
const CARD_H_VW = CARD_W_VW * (15 / 22);

/* Titles */
const TOP_TEXT = "Happy campers";
const BOT_TEXT = "Testimonies";
const TITLE_FONT = "2.1vw";

/* Pinning / animation */
const OPEN_VH = 260; // distance to fully open unveil
const SECTION_SCROLL_VH = 100 + OPEN_VH; // sticky range + one viewport

/* Row orders */
const topCards = ["test3", "test1", "test7"]; // Row 1 (LEFT)
const botCards = ["test2", "test6", "test5"]; // Row 2 (RIGHT)

/* Section background gradient — based on #c8c8b8 */
const SECTION_GRADIENT =
  "linear-gradient(180deg, #c8c8b8 0%, #eaeae3 38%, #ffffff 100%)";

/* Hex PNG sizing */
const HEX_BASE_SIZE_VW = 26; // original footprint
const HEX_SCALE = 3;         // 3× larger on screen
const HEX_SIZE_VW = HEX_BASE_SIZE_VW * HEX_SCALE;

/* Helpers */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clampVW = (vw: number) => Math.max(0, Math.min(100, vw));
function threeColumnCenters(sideColW: number) {
  const col1W = sideColW;
  const col3W = sideColW;
  const col2W = Math.max(0, 100 - col1W - col3W);
  const col1Center = col1W / 2;
  const col2Center = col1W + col2W / 2;
  const col3Center = col1W + col2W + col3W / 2;
  return { col1Center, col2Center, col3Center };
}
function computeRowLefts(p: number, direction: Dir, starts: number[], travel: number) {
  const offset = p * travel;
  return starts.map((s) => (direction === "left" ? s - offset : s + offset));
}

/* =========================
   Main component
========================= */
export default function TestimoniesAbout() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const unveilContentRef = useRef<HTMLDivElement>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [vp, setVp] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  // Derived from scroll (bidirectional)
  const [rowProgress, setRowProgress] = useState(0); // 0..1
  const [openingWidthVW, setOpeningWidthVW] = useState(0);
  const [unveilScale, setUnveilScale] = useState(1);

  // Visibility to control header GLB via bus (unchanged)
  useEffect(() => {
    const host = spacerRef.current?.closest("section, div") as HTMLElement | null;
    const target = host || spacerRef.current;
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        import("@/utils/visibilityBus").then(({ bus }) => bus.emit("hexagon:enter"));
      } else {
        import("@/utils/visibilityBus").then(({ bus }) => bus.emit("hexagon:leave"));
      }
    }, { threshold: 0.5 });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  /* measurements */
  const measure = () => {
    const header = document.querySelector<HTMLElement>("header");
    setHeaderHeight(header ? header.getBoundingClientRect().height || 0 : 0);
    setVp(window.innerHeight);
  };
  useLayoutEffect(() => {
    measure();
    setIsMeasured(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* === Single-condition flow: move rows only when section is pinned ===
     Pinned iff spacerRef.current.getBoundingClientRect().top <= 0
     If not pinned => rowProgress = 0
     If pinned => rowProgress = clamp01((-topNow) / OPEN_PX)
  */
  useEffect(() => {
    if (!isMeasured) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const topNow = spacerRef.current?.getBoundingClientRect().top ?? 1e9; // px from viewport top
        if (topNow > 0) {
          // Not pinned yet → no movement
          setRowProgress(0);
          setOpeningWidthVW(0);
          ticking = false;
          return;
        }

        // Pinned → compute progress inside sticky
        const vh = window.innerHeight || vp || 1;
        const localPx = -topNow; // how far past the top we are
        const OPEN_PX = (OPEN_VH / 100) * vh;
        const p = clamp01(localPx / Math.max(1, OPEN_PX));
        setRowProgress(p);

        // Gate the opening so it starts once cards reach center
        const { col1Center, col2Center, col3Center } = threeColumnCenters(CARD_W_VW);

        // Row 1 (LEFT)
        const row1_start_x = col3Center - CARD_W_VW / 2;
        const row1_start_x_last = row1_start_x + 2 * SPACING_VW; // test7
        const row1_end_x_last = -CARD_W_VW;
        const row1_travel = row1_start_x_last - row1_end_x_last;

        // Row 2 (RIGHT)
        const row2_start_x = col1Center - CARD_W_VW / 2;
        const row2_start_x_last = row2_start_x - 2 * SPACING_VW; // test5
        const row2_end_x_last = 100;
        const row2_travel = row2_end_x_last - row2_start_x_last;

        const p_gate7 = (row1_start_x_last + CARD_W_VW - col2Center) / Math.max(1e-6, row1_travel);
        const p_gate5 = (col2Center - row2_start_x_last) / Math.max(1e-6, row2_travel);
        const p_gate = clamp01(Math.max(p_gate7, p_gate5));

        const openP = clamp01((p - p_gate) / Math.max(1e-6, 1 - p_gate));
        setOpeningWidthVW(openP * 100);

        ticking = false;
      });
    };

    onScroll(); // init
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMeasured, vp]);

  /* scale-to-fit unveil inner content */
  useEffect(() => {
    if (!isMeasured) return;
    const n = unveilContentRef.current;
    if (!n) return;
    const available = Math.max(0, (vp || window.innerHeight) - headerHeight);
    const natural = n.scrollHeight || n.offsetHeight || 1;
    const maxScaleAllowedByHeight = (available - 24 - 200) / Math.max(1, natural);
    const target = Math.min(1.5, Math.max(0.4, maxScaleAllowedByHeight));
    setUnveilScale(isFinite(target) ? target : 1);
  }, [isMeasured, vp, headerHeight, openingWidthVW]);

  /* === Rows driven by scroll progress === */
  const { col2Center, col3Center, col1Center } = threeColumnCenters(CARD_W_VW);

  // Row 1 (LEFT)
  const row1_start_x = col3Center - CARD_W_VW / 2;
  const row1_start_x_last = row1_start_x + 2 * SPACING_VW;
  const row1_end_x_last = -CARD_W_VW;
  const row1_travel = row1_start_x_last - row1_end_x_last;
  const row1Lefts = computeRowLefts(
    rowProgress,
    "left",
    [row1_start_x, row1_start_x + SPACING_VW, row1_start_x + 2 * SPACING_VW],
    row1_travel
  );
  const row1TextCenter = col2Center - rowProgress * row1_travel;

  // Row 2 (RIGHT)
  const row2_start_x = col1Center - CARD_W_VW / 2;
  const row2_start_x_last = row2_start_x - 2 * SPACING_VW;
  const row2_end_x_last = 100;
  const row2_travel = row2_end_x_last - row2_start_x_last;
  const row2Lefts = computeRowLefts(
    rowProgress,
    "right",
    [row2_start_x, row2_start_x - SPACING_VW, row2_start_x - 2 * SPACING_VW],
    row2_travel
  );
  const row2TextCenter = col2Center + rowProgress * row2_travel;

  /* Corner PNGs */
  const pineLeftVW = 0 - rowProgress * row1_travel;
  const figueLeftVW = (100 - CARD_W_VW) + rowProgress * row2_travel;

  /* Opening clip */
  const half = openingWidthVW / 2;
  const openingLeftVW = clampVW(col2Center - half);
  const openingRightVW = clampVW(col2Center + half);
  const openingClip = `inset(0 ${Math.max(0, 100 - openingRightVW)}vw 0 ${Math.max(0, openingLeftVW)}vw)`;

  /* assets / texts */
  const b1ImageFor = (id: string): string | undefined => {
    if (id === "test1") return "/about/test1block1.jpg";
    if (id === "test2") return "/about/test2block1.jpg";
    if (id === "test3") return "/about/test3block1.jpg";
    if (id === "test5") return "/about/test5block1.jpg";
    if (id === "test6") return "/about/test6block1.jpg";
    if (id === "test7") return "/about/test7block1.jpg";
    return undefined;
  };
  const block3TextFor = (id: string): ReactNode => {
    switch (id) {
      case "test1": return <>Arvo Kaasin<br/>food blogger<br/>Estonia</>;
      case "test2": return <>Gunnar Gimbutas<br/>youtuber<br/>Finland</>;
      case "test3": return <>Ingvar Minnus<br/>food blogger<br/>Estonia</>;
      case "test5": return <>Kostjutsenko Vitali<br/>CEO<br/>Estonia</>;
      case "test6": return <>Svante Pettersson<br/>smoking food expert<br/>Sweeden</>;
      case "test7": return <>Tõnu Peit<br/>youtuber<br/>Estonia</>;
      default: return id;
    }
  };
  const block4TextFor = (id: string): ReactNode | undefined => {
    switch (id) {
      case "test1": return <>“Easy setup, powerful airflow with the new compressor, and no ash falling out. You can tell this was designed by someone who actually smokes food. Highly recommended!“</>;
      case "test2": return <>“It works beautifully — the smoke is clean, the build quality is solid, and it fits my Kamado grill perfectly.”</>;
      case "test3": return <>“Set it up in my small smokehouse. No hassle — it just works. The smoke is smooth and steady.“</>;
      case "test5": return <>“The best thing since sliced bread.”</>;
      case "test6": return <>“SG2 is really a great thing.”</>;
      case "test7": return <>“Let’s see how SG2 works.”</>;
      default: return undefined;
    }
  };
  const block2For = (id: string):
    | { type: "iframe"; src: string; title: string; overlayHref?: string; overlayLabel?: string }
    | { type: "image"; src: string; alt?: string }
    | undefined => {
    switch (id) {
      case "test1":
        return { type: "iframe", src: "https://www.youtube.com/embed/_qoIM4S_sW0", title: "YouTube video (test1)", overlayHref: "https://www.facebook.com/profile.php?id=100011341670526", overlayLabel: "Facebook" };
      case "test2":
        return { type: "iframe", src: "https://www.youtube.com/embed/T_DVS1G5QCw", title: "YouTube video (test2)" };
      case "test3":
        return { type: "iframe", src: "https://www.youtube.com/embed/C-pc6Lamxbc", title: "YouTube video (test3)" };
      case "test5":
        return { type: "iframe", src: "https://www.youtube.com/embed/mG-iZ_05ELU", title: "YouTube Shorts (test5)" };
      case "test6":
        return { type: "image", src: "/about/svante.jpg", alt: "Svante" };
      case "test7":
        return { type: "iframe", src: "https://www.youtube.com/embed/bORcZkRaByI", title: "YouTube video (test7)" };
      default:
        return undefined;
    }
  };

  return (
    <div ref={spacerRef} className="relative" style={{ height: `${SECTION_SCROLL_VH}vh` }}>
      <section
        aria-label="TestimoniesAbout"
        className="sticky top-0 h-screen overflow-hidden isolate"
        style={{ background: SECTION_GRADIENT }}
      >
        {/* Opening (center) */}
        <div className="absolute inset-x-0" style={{ top: headerHeight, bottom: 0 }}>
          {openingWidthVW > 0 && (
            <div
              className="absolute inset-0"
              style={{ zIndex: 10, backgroundColor: LIGHT_GREY, clipPath: openingClip, overflow: "hidden" }}
            >
              {/* Hex PNG inside opening */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `-${HEX_SIZE_VW * 0.5}vw`,
                  transform: "translateY(-50%)",
                  width: `${HEX_SIZE_VW}vw`,
                  height: `${HEX_SIZE_VW}vw`,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                <img
                  src="/hexagon/hexflat.png"
                  alt="Hexagon flat"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </div>

              {/* Unveiled content */}
              <div
                ref={unveilContentRef}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translateY(200px) scale(${unveilScale})`,
                  transformOrigin: "center top",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2.2vw",
                  width: "100%",
                  zIndex: 3,
                }}
              >
                {/* GLB box */}
                <div style={{ position: "relative", width: "100%", height: "min(56vh, 680px)", overflow: "visible" }}>
                  <ThreeModel modelPath="/about/tiskre.glb" height={"100%"} />
                </div>

                {/* Photos row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2vw", width: "100%" }}>
                  <img
                    src="/about/vitali.jpg"
                    alt="Vitali"
                    style={{ height: "min(40vh, 56vh)", aspectRatio: "1 / 1", objectFit: "cover" }}
                  />
                  <div className="relative group cursor-pointer" style={{ height: "min(40vh, 56vh)", aspectRatio: "2 / 1" }}>
                    <img
                      src="/about/team.jpg"
                      alt="Our team"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <Link
                      href="/about"
                      aria-label="About us"
                      className="absolute inset-0 flex items-center justify-content-center bg-black/40 text-white font-extrabold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ textDecoration: "none", letterSpacing: "0.04em", fontSize: "clamp(12px, 1.2vw, 20px)", display: "flex", justifyContent: "center" }}
                    >
                      About us
                    </Link>
                  </div>
                </div>
              </div>

              {/* Grouser bottom-right */}
              <img
                src="/popular/grouser.png"
                alt="Grouser"
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: `${CARD_W_VW}vw`,
                  height: `${CARD_H_VW}vw`,
                  objectFit: "contain",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </div>
          )}

          {/* Row 1 — LEFT */}
          <div className="absolute inset-x-0 pointer-events-none" style={{ top: 0, height: "50%", zIndex: 2 }}>
            <img
              src="/popular/pine.png"
              alt="Pine"
              style={{
                position: "absolute",
                top: 0,
                left: `${pineLeftVW}vw`,
                width: `${CARD_W_VW}vw`,
                height: `${CARD_H_VW}vw`,
                objectFit: "contain",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
            <RowText centerLeftVW={row1TextCenter} text={TOP_TEXT} />
            {topCards.map((id, i) => {
              const b2 = block2For(id);
              return (
                <Card22x15
                  key={id}
                  leftVW={row1Lefts[i]}
                  centerYPercent={50}
                  label={id}
                  themeColor={["#fde68a", "#fca5a5", "#93c5fd"][i]}
                  b1ImageSrc={b1ImageFor(id)}
                  block3Text={block3TextFor(id)}
                  block4Text={block4TextFor(id)}
                  b2={b2}
                />
              );
            })}
          </div>

          {/* Row 2 — RIGHT */}
          <div className="absolute inset-x-0 pointer-events-none" style={{ top: "50%", height: "50%", zIndex: 2 }}>
            <img
              src="/popular/figue.png"
              alt="Figue"
              style={{
                position: "absolute",
                bottom: 0,
                left: `${figueLeftVW}vw`,
                width: `${CARD_W_VW}vw`,
                height: `${CARD_H_VW}vw`,
                objectFit: "contain",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
            <RowText centerLeftVW={row2TextCenter} text={BOT_TEXT} />
            {botCards.map((id, i) => {
              const b2 = block2For(id);
              return (
                <Card22x15
                  key={id}
                  leftVW={row2Lefts[i]}
                  centerYPercent={50}
                  label={id}
                  themeColor={["#fef08a", "#f9a8d4", "#a7f3d0"][i]}
                  b1ImageSrc={b1ImageFor(id)}
                  block3Text={block3TextFor(id)}
                  block4Text={block4TextFor(id)}
                  b2={b2}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================
   Presentational bits
========================= */
function RowText({ centerLeftVW, text }: { centerLeftVW: number; text: string }) {
  return (
    <div
      className="absolute font-extrabold text-gray-900 text-center select-none"
      style={{
        top: "50%",
        left: `${centerLeftVW}vw`,
        transform: "translate(-50%, -50%)",
        lineHeight: 1.05,
        zIndex: 3,
        fontSize: TITLE_FONT,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function Card22x15({
  leftVW,
  centerYPercent,
  label,
  themeColor,
  b1ImageSrc,
  block3Text,
  block4Text,
  b2,
}: {
  leftVW: number;
  centerYPercent: number;
  label: string;
  themeColor: string;
  b1ImageSrc?: string;
  block3Text?: ReactNode;
  block4Text?: ReactNode;
  b2?:
    | { type: "iframe"; src: string; title: string; overlayHref?: string; overlayLabel?: string }
    | { type: "image"; src: string; alt?: string };
}) {
  const colLeftPct = (6 / 22) * 100;
  const colRightPct = (16 / 22) * 100;
  const rowTopPct = (9 / 15) * 100;
  const rowBottomPct = (6 / 15) * 100;

  return (
    <div
      className="absolute"
      style={{
        left: `${leftVW}vw`,
        top: `${centerYPercent}%`,
        transform: "translateY(-50%)",
        width: `${CARD_W_VW}vw`,
        height: `${CARD_H_VW}vw`,
        background: "#ffffff",
        userSelect: "none",
        zIndex: 3,
        overflow: "visible",
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        pointerEvents: "auto",
      }}
    >
      <div className="relative w-full h-full">
        {/* B1 */}
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: `${colLeftPct}%`,
            height: `${rowTopPct}%`,
            background: b1ImageSrc ? "transparent" : themeColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f172a",
            fontWeight: 800,
            overflow: "hidden",
          }}
        >
          {b1ImageSrc ? (
            <img
              src={b1ImageSrc}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <div
              style={{
                width: "86%",
                height: "86%",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15))",
              }}
            />
          )}
        </div>

        {/* B2 */}
        <div
          className="absolute"
          style={{
            left: `${colLeftPct}%`,
            top: 0,
            width: `${colRightPct}%`,
            height: `${rowTopPct}%`,
            background: "#000",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {b2?.type === "iframe" ? (
            <>
              <iframe
                src={b2.src}
                title={b2.title}
                style={{ width: "100%", height: "100%", border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {"overlayHref" in b2 && b2.overlayHref && "overlayLabel" in b2 && b2.overlayLabel ? (
                <a
                  href={b2.overlayHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute",
                    right: "0.6vw",
                    bottom: "0.6vw",
                    background: "rgba(255,255,255,0.9)",
                    color: "#111",
                    padding: "0.2vw 0.5vw",
                    borderRadius: "0.4vw",
                    fontSize: "0.8vw",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {b2.overlayLabel}
                </a>
              ) : null}
            </>
          ) : b2?.type === "image" ? (
            <img
              src={b2.src}
              alt={b2.alt || ""}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <div style={{ padding: "0 0.6vw", textAlign: "center", fontWeight: 700, fontSize: "0.9vw" }}>
              16×9
            </div>
          )}
        </div>

        {/* B3 */}
        <div
          className="absolute"
          style={{
            left: 0,
            top: `${rowTopPct}%`,
            width: `${colLeftPct}%`,
            height: `${rowBottomPct}%`,
            background: "#111827",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9vw",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.25,
            padding: "0 0.4vw",
          }}
        >
          {block3Text ?? label}
        </div>

        {/* B4 */}
        <div
          className="absolute"
          style={{
            left: `${colLeftPct}%`,
            top: `${rowTopPct}%`,
            width: `${colRightPct}%`,
            height: `${rowBottomPct}%`,
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            paddingLeft: "1vw",
            paddingRight: "1vw",
            fontSize: "0.9vw",
            color: "#111",
          }}
        >
          <div
            style={{
              width: "100%",
              overflowWrap: "anywhere",
              whiteSpace: "normal",
              lineHeight: 1.25,
              fontWeight: 600,
            }}
          >
            {block4Text ?? `Sample caption for ${label}`}
          </div>
        </div>
      </div>
    </div>
  );
}
