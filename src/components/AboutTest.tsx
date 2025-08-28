"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * AboutTest.tsx — initial-state locked to columns, then free belt shift.
 *
 * - Full-screen sticky section that pins only when 100% on screen.
 * - Two rows, each with 3 columns: [card | 20vw titles | card].
 * - Cards are "connected" to the columns ONLY for the initial state (t=0):
 *     • Row 1 shows test1 in column 3 (right card column)
 *     • Row 2 shows test6 in column 1 (left card column)
 *   After permission is granted, belts slide horizontally regardless of columns.
 * - Debug permission: animation is ARMED only after the user presses the "y" key.
 *   Until then, the initial screen is shown (no movement).
 * - Vertical scroll releases when both rows finish their horizontal distance.
 *
 * Card metrics:
 *   width = 28vw; height = width * (15/22) ≈ 19.09vw; gap = 3vw; step = 31vw.
 * Titles:
 *   Row 1 center: "Happy campers"; Row 2 center: "Testimonies"; font-size 2.1vw.
 */

/* =========================
   Config
   ========================= */
const TITLE_FONT = "2.1vw";
const CARD_W_VW = 28; // vw
const GAP_VW = 3;     // vw
const STEP_VW = CARD_W_VW + GAP_VW; // 31vw

// Pinned scroll budget (vh). Larger → slower.
const PIN_VH = 220;

// Travel distances in card steps (keep equal so both rows end together)
const TOP_STEPS = 2; // row 1 slides LEFT by 2 steps
const BOT_STEPS = 2; // row 2 slides RIGHT by 2 steps

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);

export default function AboutTest() {
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [lockY, setLockY] = useState<number | null>(null);
  const [t, setT] = useState(0);        // progress 0→1 while pinned
  const [armed, setArmed] = useState(false); // becomes true after user presses 'y'

  // Detect 100% visibility
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && e.intersectionRatio === 1) {
          setIsFull(true);
          if (lockY === null) setLockY(window.scrollY);
        } else if (e.intersectionRatio < 1) {
          setIsFull(false);
        }
      },
      { threshold: [1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lockY]);

  // Debug permission: press 'y' to arm the animation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') setArmed(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drive progress via scroll ONLY when armed and fully visible
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!isFull || lockY == null || !armed) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const lockPx = (PIN_VH / 100) * window.innerHeight;
        const p = clamp((window.scrollY - lockY) / Math.max(1, lockPx));
        setT(p);
        ticking = false;
      });
    };
    const onResize = () => onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [isFull, lockY, armed]);

  // Row translations (in vw). After arming, belts move freely against columns.
  const topDxVw = -TOP_STEPS * STEP_VW * t; // LEFT
  const botDxVw = +BOT_STEPS * STEP_VW * t; // RIGHT

  // Keep section pinned through the animation, then release
  const done = t >= 1;
  const spacerStyle: CSSProperties = { height: `calc(${done ? 100 : 100 + PIN_VH}vh)` };

  return (
    <section style={spacerStyle} className="w-full">
      <div ref={stickyRef} className="sticky top-0 h-[100vh] w-full overflow-hidden bg-[#f5f5f5]">
        {/* 2 equal-height rows, each with [28vw | 20vw | 28vw] columns */}
        <div className="grid h-full w-full grid-rows-2">
          {/* ===== Row 1 ===== */}
          <div className="grid grid-cols-[minmax(0,28vw)_20vw_minmax(0,28vw)] items-center">
            {/* col 1 (empty for symmetry at initial state) */}
            <div />

            {/* col 2 — title */}
            <div className="pointer-events-none select-none text-center">
              <div style={{ fontSize: TITLE_FONT }} className="font-medium leading-none">Happy campers</div>
              {!armed && (
                <div className="mt-2 text-xs text-neutral-500">Press <kbd className="rounded bg-neutral-200 px-1">y</kbd> to start</div>
              )}
            </div>

            {/* col 3 — carousel belt; initially centered on test1 */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <RowCarouselVW
                items={["test1", "test2", "test3"]}
                translateVw={topDxVw}
                cardWvw={CARD_W_VW}
                gapVw={GAP_VW}
                initialIndex={0} // index of the card we want centered at t=0 → test1
              />
            </div>
          </div>

          {/* ===== Row 2 ===== */}
          <div className="grid grid-cols-[minmax(0,28vw)_20vw_minmax(0,28vw)] items-center">
            {/* col 1 — carousel belt; initially centered on test6 */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <RowCarouselVW
                items={["test4", "test5", "test6"]}
                translateVw={botDxVw}
                cardWvw={CARD_W_VW}
                gapVw={GAP_VW}
                initialIndex={2} // center test6 at t=0 in left column
              />
            </div>

            {/* col 2 — title */}
            <div className="pointer-events-none select-none text-center">
              <div style={{ fontSize: TITLE_FONT }} className="font-medium leading-none">Testimonies</div>
            </div>

            {/* col 3 (empty for symmetry at initial) */}
            <div />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * RowCarouselVW — horizontal belt of cards measured in vw.
 * At t=0 we align the card at initialIndex to the column center. After that, the belt
 * slides by translateVw without respecting column alignment (as requested).
 */
function RowCarouselVW({
  items,
  translateVw,
  cardWvw,
  gapVw,
  initialIndex = 0,
}: {
  items: string[];
  translateVw: number; // signed vw (negative left, positive right)
  cardWvw: number;     // vw
  gapVw: number;       // vw
  initialIndex?: number;
}) {
  const step = cardWvw + gapVw; // vw
  const initialOffsetVw = -initialIndex * step; // puts selected card at center initially

  return (
    <div className="relative" style={{ width: `${cardWvw}vw`, height: `calc(${cardWvw}vw * 15 / 22)` }}>
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ gap: `${gapVw}vw`, transform: `translate(calc(-50% + ${initialOffsetVw + translateVw}vw), -50%)` }}
      >
        {items.map((name) => (
          <CardVW key={name} title={name} wvw={cardWvw} />
        ))}
      </div>
    </div>
  );
}

/** Card component using 22×15 internal grid (6×9, 16×9, 6×6, 16×6) */
function CardVW({ title, wvw }: { title: string; wvw: number }) {
  const style: CSSProperties = {
    width: `${wvw}vw`,
    height: `calc(${wvw}vw * 15 / 22)`, // ≈19.09vw when wvw=28
  };
  return (
    <div className="rounded-xl border border-neutral-300 bg-white shadow-sm" style={style}>
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `repeat(22, 1fr)`, gridTemplateRows: `repeat(15, 1fr)` }}
      >
        <div className="bg-neutral-100" style={{ gridColumn: "1 / span 6", gridRow: "1 / span 9" }} />
        <div className="bg-neutral-200" style={{ gridColumn: "7 / span 16", gridRow: "1 / span 9" }} />
        <div className="bg-neutral-50" style={{ gridColumn: "1 / span 6", gridRow: "10 / span 6" }} />
        <div className="bg-neutral-300" style={{ gridColumn: "7 / span 16", gridRow: "10 / span 6" }} />
        <div className="pointer-events-none col-span-22 row-span-15 flex items-center justify-center">
          <span className="text-sm font-medium text-neutral-700">{title}</span>
        </div>
      </div>
    </div>
  );
}
