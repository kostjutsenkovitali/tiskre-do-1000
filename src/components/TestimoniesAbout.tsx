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
   Scroll lock helpers
========================= */
function lockScroll(): number {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const body = document.body;
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  return scrollY;
}
function unlockScroll(prevY: number) {
  const body = document.body;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  window.scrollTo(0, prevY || 0);
}

/* =========================
   G-code parsing
========================= */
type Seg = { a: [number, number]; b: [number, number]; len: number };
type BBox = { xmin: number; ymin: number; xmax: number; ymax: number };

const WORD_RE = /([A-Za-z])\s*(?:=)?\s*([+\-]?(?:\d+(?:\.\d*)?|\.\d+))/g;

function stripComments(text: string) {
  return text.replace(/\([^)]*\)/g, "").replace(/;.*$/gm, "");
}
function parseWords(line: string) {
  const out: Array<{ type?: "G" | "M" | "N"; val?: number; axis?: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(line))) {
    const k = m[1].toUpperCase();
    const v = parseFloat(m[2]);
    if (!Number.isFinite(v)) continue;
    if (k === "G" || k === "M" || k === "N") out.push({ type: k as any, val: Math.trunc(v) });
    else if ("XYZIJKFR".includes(k)) out.push({ axis: k, val: v });
  }
  return out;
}
function centerFromR(x0: number, y0: number, x1: number, y1: number, R: number, cw: boolean) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  if (d === 0) return null;
  const r = Math.abs(R);
  if (d / 2 > r) return null;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const h = Math.sqrt(Math.max(0, r * r - (d * d) / 4));
  const ux = -dy / d, uy = dx / d;
  const c1 = { x: mx + ux * h, y: my + uy * h };
  const c2 = { x: mx - ux * h, y: my - uy * h };
  function info(c: { x: number; y: number }) {
    let a0 = Math.atan2(y0 - c.y, x0 - c.x);
    let a1 = Math.atan2(y1 - c.y, x1 - c.x);
    let ccw = a1 - a0;
    if (ccw < 0) ccw += Math.PI * 2;
    return { ccw, cw: Math.PI * 2 - ccw };
  }
  const wantMinor = R >= 0;
  const s1 = info(c1), s2 = info(c2);
  const score = (s: { ccw: number; cw: number }) => {
    const ang = cw ? s.cw : s.ccw;
    const minor = ang <= Math.PI + 1e-6;
    return minor === wantMinor ? ang : Infinity;
  };
  const sc1 = score(s1), sc2 = score(s2);
  if (sc1 === Infinity && sc2 === Infinity) return cw ? (s1.cw < s2.cw ? c1 : c2) : (s1.ccw < s2.ccw ? c1 : c2);
  return sc1 <= sc2 ? c1 : c2;
}
function parseGcodeToSegments(text: string): { segs: Seg[]; bbox: BBox; total: number } {
  const lines = stripComments(text).split(/\r?\n/);
  let abs = true;
  let cur = { x: 0, y: 0 };
  let stroke: [number, number][] = [];
  const segs: Seg[] = [];

  function penUp() {
    if (stroke.length >= 2) {
      for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1], b = stroke[i];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 0) segs.push({ a, b, len });
      }
    }
    stroke = [];
  }
  function ensureStart() {
    if (!stroke.length) stroke.push([cur.x, cur.y]);
  }
  function down(x: number, y: number) {
    ensureStart();
    stroke.push([x, y]);
    cur.x = x;
    cur.y = y;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const words = parseWords(raw);
    if (!words.length) continue;
    let g: number | null = null;
    const p: Record<string, number> = {};
    for (const w of words) {
      if (w.type === "G" && typeof w.val === "number") g = w.val;
      if (w.axis && typeof w.val === "number") p[w.axis] = w.val;
    }
    if (g === 90) { abs = true; continue; }
    if (g === 91) { abs = false; continue; }

    const tx = p.X !== undefined ? (abs ? p.X : cur.x + p.X) : cur.x;
    const ty = p.Y !== undefined ? (abs ? p.Y : cur.y + p.Y) : cur.y;

    if (g === 0) { cur.x = tx; cur.y = ty; penUp(); continue; }
    if (g === 1) { down(tx, ty); continue; }

    if (g === 2 || g === 3) {
      const cw = g === 2;
      const hasIJ = p.I !== undefined && p.J !== undefined;
      const hasR = p.R !== undefined;
      if (!(hasIJ || hasR)) { down(tx, ty); continue; }
      let cx: number, cy: number, r: number;
      if (hasIJ) { cx = cur.x + p.I; cy = cur.y + p.J; r = Math.hypot(cur.x - cx, cur.y - cy); }
      else {
        const c = centerFromR(cur.x, cur.y, tx, ty, p.R as number, cw);
        if (!c) { down(tx, ty); continue; }
        cx = c.x; cy = c.y; r = Math.hypot(cur.x - cx, cur.y - cy);
      }
      let a0 = Math.atan2(cur.y - cy, cur.x - cx);
      let a1 = Math.atan2(ty - cy, tx - cx);
      if (cw) { if (a1 >= a0) a1 -= Math.PI * 2; } else { if (a1 <= a0) a1 += Math.PI * 2; }
      const sweep = a1 - a0;
      const steps = Math.max(6, Math.min(2000, Math.floor(Math.abs(sweep) * r / 2)));
      ensureStart();
      for (let k = 1; k <= steps; k++) {
        const ang = a0 + sweep * (k / steps);
        stroke.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
      }
      cur.x = tx; cur.y = ty;
      continue;
    }
  }
  penUp();

  // bbox + total
  let xmin = +Infinity, ymin = +Infinity, xmax = -Infinity, ymax = -Infinity, total = 0;
  for (const s of segs) {
    xmin = Math.min(xmin, s.a[0], s.b[0]);
    ymin = Math.min(ymin, s.a[1], s.b[1]);
    xmax = Math.max(xmax, s.a[0], s.b[0]);
    ymax = Math.max(ymax, s.a[1], s.b[1]);
    total += s.len;
  }
  if (!isFinite(xmin)) { xmin = 0; ymin = 0; xmax = 1; ymax = 1; }
  return { segs, bbox: { xmin, ymin, xmax, ymax }, total };
}

/* Fit world → screen (shared) */
function makeFitter(b: BBox, W: number, H: number, pad = 20) {
  const w = b.xmax - b.xmin, h = b.ymax - b.ymin;
  const sx = (W - 2 * pad) / (w || 1), sy = (H - 2 * pad) / (h || 1);
  const s = Math.min(sx, sy);
  const ox = pad - b.xmin * s + (W - 2 * pad - w * s) / 2;
  const oy = pad - b.ymin * s + (H - 2 * pad - h * s) / 2;
  return (p: [number, number]) => [ox + p[0] * s, H - (oy + p[1] * s)] as [number, number];
}
function unionBBox(bs: (BBox | null | undefined)[]): BBox | null {
  let xmin = +Infinity, ymin = +Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const b of bs) {
    if (!b) continue;
    xmin = Math.min(xmin, b.xmin);
    ymin = Math.min(ymin, b.ymin);
    xmax = Math.max(xmax, b.xmax);
    ymax = Math.max(ymax, b.ymax);
  }
  if (!isFinite(xmin)) return null;
  return { xmin, ymin, xmax, ymax };
}

/* =========================
   Multi-laser overlay (absolute space)
========================= */
function MultiLaserOverlayAbsolute({
  active,
  targets,
  durationMs = 20000,
  anchorRef,
  onDone,
}: {
  active: boolean;
  targets: Array<{ segs: Seg[] | null; bbox: BBox | null }>;
  durationMs?: number;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  onDone: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const fitCanvasDPR = () => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = c.getBoundingClientRect();
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    const ctx = c.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      return;
    }

    fitCanvasDPR();
    const c = ref.current!;
    const ctx = c.getContext("2d")!;

    const totals = targets.map(t => (t.segs || []).reduce((a, s) => a + s.len, 0));
    const anySegs = totals.some(t => t > 0);
    const worldBBox = unionBBox(targets.map(t => t.bbox));

    const onResize = () => fitCanvasDPR();
    window.addEventListener("resize", onResize);

    const loop = (ts: number) => {
      if (!anySegs || !worldBBox) {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, c.clientWidth, c.clientHeight);
        ctx.fillStyle = "#fff";
        ctx.font = "16px system-ui, sans-serif";
        ctx.fillText("Loading cutting paths…", 24, 40);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Determine drawing area (GLB box) or fallback
      const cvsRect = c.getBoundingClientRect();
      const fitRect = (() => {
        const el = anchorRef?.current || null;
        if (el) {
          const r = el.getBoundingClientRect();
          const x = Math.max(0, r.left - cvsRect.left);
          const y = Math.max(0, r.top - cvsRect.top);
          const w = Math.max(40, Math.min(c.clientWidth, r.width));
          const h = Math.max(40, Math.min(c.clientHeight, r.height));
          return { x, y, w, h };
        }
        const padW = c.clientWidth * 0.1;
        const padH = c.clientHeight * 0.15;
        return { x: padW, y: padH, w: c.clientWidth - 2 * padW, h: c.clientHeight - 2 * padH };
      })();

      // Clear
      ctx.clearRect(0, 0, c.width, c.height);

      // Shared fitter from union bbox → glb box area
      const baseFit = makeFitter(worldBBox, fitRect.w, fitRect.h, 24);
      const fit = (p: [number, number]) => {
        const r = baseFit(p);
        return [r[0] + fitRect.x, r[1] + fitRect.y] as [number, number];
      };

      // Optional: draw world frame + origin
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      const p0 = fit([worldBBox.xmin, worldBBox.ymin]);
      const p1 = fit([worldBBox.xmax, worldBBox.ymin]);
      const p2 = fit([worldBBox.xmax, worldBBox.ymax]);
      const p3 = fit([worldBBox.xmin, worldBBox.ymax]);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]);
      ctx.closePath(); ctx.stroke();
      const o = fit([0,0]);
      ctx.beginPath(); ctx.arc(o[0], o[1], 3, 0, Math.PI*2); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.restore();

      // Draw each target in shared space
      for (let i = 0; i < targets.length; i++) {
        const segs = targets[i].segs || [];
        const total = totals[i] || 0;
        if (!segs.length || total <= 0) continue;

        const progLen = total * progress;
        const hotWindow = 0.06 * total;
        const coolEnd = Math.max(0, progLen - hotWindow);

        function drawPartial(seg: Seg, fromLen: number, toLen: number, moveEach = true) {
          const t0 = fromLen / seg.len, t1 = toLen / seg.len;
          const p0_ = fit([seg.a[0] + (seg.b[0] - seg.a[0]) * t0, seg.a[1] + (seg.b[1] - seg.a[1]) * t0]);
          const p1_ = fit([seg.a[0] + (seg.b[0] - seg.a[0]) * t1, seg.a[1] + (seg.b[1] - seg.a[1]) * t1]);
          if (moveEach) ctx.moveTo(p0_[0], p0_[1]); else ctx.lineTo(p0_[0], p0_[1]);
          ctx.lineTo(p1_[0], p1_[1]);
        }
        function pointAtLen(L: number) {
          let acc = 0;
          for (const s of segs) {
            if (acc + s.len >= L) {
              const t = (L - acc) / s.len;
              return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t] as [number, number];
            }
            acc += s.len;
          }
          const last = segs[segs.length - 1];
          return last ? last.b : ([0, 0] as [number, number]);
        }

        // faint outline
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        for (const s of segs) {
          const a = fit(s.a);
          const b = fit(s.b);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
        ctx.restore();

        // cooled trail
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3a3f47";
        ctx.beginPath();
        let remainCool = coolEnd;
        for (const s of segs) {
          if (remainCool <= 0) break;
          const use = Math.min(remainCool, s.len);
          drawPartial(s, 0, use, false);
          remainCool -= use;
        }
        ctx.stroke();
        ctx.restore();

        // hot trail
        ctx.save();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = "#ff8c3a";
        ctx.shadowColor = "#ff8c3a";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        let remainHot = progLen - coolEnd;
        let pos = coolEnd;
        for (const s of segs) {
          if (pos >= s.len) { pos -= s.len; continue; }
          const use = Math.min(remainHot, s.len - pos);
          drawPartial(s, pos, pos + use, true);
          remainHot -= use;
          pos = 0;
          if (remainHot <= 0) break;
        }
        ctx.stroke();
        ctx.restore();

        // tip glow
        const tip = fit(pointAtLen(progLen));
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(tip[0], tip[1], 6 - k * 2, 0, Math.PI * 2);
          ctx.fillStyle =
            k === 0 ? "rgba(255,255,255,0.9)" :
            k === 1 ? "rgba(255,200,120,0.5)" :
                      "rgba(255,120,40,0.25)";
          ctx.fill();
        }
        ctx.restore();
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        onDone();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [active, targets, durationMs, anchorRef, onDone]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        display: active ? "block" : "none",
        background: "transparent",
      }}
    >
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

/* =========================
   Main component
========================= */
export default function TestimoniesAbout() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const unveilContentRef = useRef<HTMLDivElement>(null);

  // GLB box anchor for lasers
  const glbBoxRef = useRef<HTMLDivElement>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [vp, setVp] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  // Derived from scroll (bidirectional)
  const [rowProgress, setRowProgress] = useState(0); // 0..1
  const [openingWidthVW, setOpeningWidthVW] = useState(0);
  const [unveilScale, setUnveilScale] = useState(1);

  // After laser finishes, swap models
  const [showFrame, setShowFrame] = useState(false);

  // Visibility for header GLB (unchanged)
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

  /* === Single-condition flow: rows move only while pinned === */
  useEffect(() => {
    if (!isMeasured) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const topNow = spacerRef.current?.getBoundingClientRect().top ?? 1e9;
        if (topNow > 0) {
          setRowProgress(0);
          setOpeningWidthVW(0);
          ticking = false;
          return;
        }

        const vh = window.innerHeight || vp || 1;
        const localPx = -topNow;
        const OPEN_PX = (OPEN_VH / 100) * vh;
        const p = clamp01(localPx / Math.max(1, OPEN_PX));
        setRowProgress(p);

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

    onScroll();
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

  /* =========================
     Laser: state + load 3 files (absolute space)
  ========================= */
  const [laserActive, setLaserActive] = useState(false);
  const [laserDone, setLaserDone] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const lockYRef = useRef(0);

  const [targets, setTargets] = useState<Array<{ segs: Seg[] | null; bbox: BBox | null }>>([]);

  // Prefetch and parse three G-code files (same absolute (0,0) as the GLB)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const files = ["/hexagon/t_RED.INC", "/hexagon/D_RED.INC", "/hexagon/O_RED.INC"];
      try {
        const results = await Promise.all(files.map(async (path) => {
          try {
            const res = await fetch(path, { cache: "force-cache" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const txt = await res.text();
            const { segs, bbox } = parseGcodeToSegments(txt);
            return { segs, bbox };
          } catch {
            const sample = `
              G90
              G00 X0 Y0
              G01 X4500 Y0
              G01 X4500 Y1900
              G01 X0 Y1900
              G01 X0 Y0
            `;
            const { segs, bbox } = parseGcodeToSegments(sample);
            return { segs, bbox };
          }
        }));
        if (!cancelled) setTargets(results);
      } catch {
        if (!cancelled) {
          const sample = `
            G90
            G00 X0 Y0
            G01 X4500 Y0
            G01 X4500 Y1900
            G01 X0 Y1900
            G01 X0 Y0
          `;
          const { segs, bbox } = parseGcodeToSegments(sample);
          setTargets([{ segs, bbox }, { segs, bbox }, { segs, bbox }]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start laser when veil fully open; lock scroll
  useEffect(() => {
    const fullyOpen = openingWidthVW >= 99.5;
    if (fullyOpen && !laserActive && !laserDone) {
      lockYRef.current = lockScroll();
      setScrollLocked(true);
      setLaserActive(true);
    }
  }, [openingWidthVW, laserActive, laserDone]);

  // Unlock scroll after laser finishes (release vertical)
  useEffect(() => {
    if (laserDone && scrollLocked) {
      unlockScroll(lockYRef.current);
      setScrollLocked(false);
    }
  }, [laserDone, scrollLocked]);

  /* === Rows driven by scroll progress (unchanged) === */
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
        {/* Laser overlay: ALL THREE files in the same absolute coordinate space */}
        <MultiLaserOverlayAbsolute
          active={laserActive}
          targets={targets}
          durationMs={20000}
          anchorRef={glbBoxRef}
          onDone={() => {
            setLaserActive(false);
            setLaserDone(true);
            setShowFrame(true); // swap to frame.glb
          }}
        />

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
                {/* GLB box (anchor for lasers) */}
                <div
                  ref={glbBoxRef}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "min(56vh, 680px)",
                    overflow: "visible",
                    transform: "translateY(-60px)",
                    border: "3px dashed #ff0066",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "100%",
                      height: "calc(100% - 12px)",
                    }}
                  >
                    <ThreeModel
                      modelPath={showFrame ? "/about/frame.glb" : "/about/tiskre.glb"}
                      height={"100%"}
                      scale={0.7}
                    />
                  </div>
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
