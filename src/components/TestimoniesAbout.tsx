// src/components/TestimoniesAbout.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, ReactNode } from "react";
import Link from "next/link";
// useI18n imported once at top (line 6). Remove duplicate import here.
import ThreeModel, { ThreeModelHandle } from "@/components/ThreeModel";
import * as THREE from "three";

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
import { useI18n } from "@/contexts/I18nProvider";
const TOP_TEXT_KEY = "Home.testimonies.topText";
const BOT_TEXT_KEY = "Home.testimonies.bottomText";
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
   G-code parsing (with feed rates)
========================= */
type Seg = {
  a: [number, number];
  b: [number, number];
  len: number;
  feed?: number;      // mm/min (or your machine units/min)
  rapid?: boolean;    // true for G0 jogs (we won't render them)
  hidden?: boolean;   // crossing marker – render invisible but keep timing
};
type BBox = { xmin: number; ymin: number; xmax: number; ymax: number };
const SHEET_BBOX: BBox = { xmin: 0, ymin: 0, xmax: 4500, ymax: 1900 };
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
  let curFeed: number | undefined = undefined; // last specified F
  const segs: Seg[] = [];

  function pushSeg(x1: number, y1: number, rapid = false) {
    const a: [number, number] = [cur.x, cur.y];
    const b: [number, number] = [x1, y1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > 0) segs.push({ a, b, len, feed: curFeed, rapid });
    cur.x = x1; cur.y = y1;
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
    if (p.F !== undefined && Number.isFinite(p.F)) curFeed = p.F;

    if (g === 90) { abs = true; continue; }
    if (g === 91) { abs = false; continue; }

    const tx = p.X !== undefined ? (abs ? p.X : cur.x + p.X) : cur.x;
    const ty = p.Y !== undefined ? (abs ? p.Y : cur.y + p.Y) : cur.y;

    if (g === 0) { // rapid
      pushSeg(tx, ty, true);
      continue;
    }
    if (g === 1) { // linear cut
      pushSeg(tx, ty, false);
      continue;
    }

    if (g === 2 || g === 3) {
      const cw = g === 2;
      const hasIJ = p.I !== undefined && p.J !== undefined;
      const hasR = p.R !== undefined;
      if (!(hasIJ || hasR)) { pushSeg(tx, ty, false); continue; }

      let cx: number, cy: number, r: number;
      if (hasIJ) { cx = cur.x + p.I; cy = cur.y + p.J; r = Math.hypot(cur.x - cx, cur.y - cy); }
      else {
        const c = centerFromR(cur.x, cur.y, tx, ty, p.R as number, cw);
        if (!c) { pushSeg(tx, ty, false); continue; }
        cx = c.x; cy = c.y; r = Math.hypot(cur.x - cx, cur.y - cy);
      }
      let a0 = Math.atan2(cur.y - cy, cur.x - cx);
      let a1 = Math.atan2(ty - cy, tx - cx);
      if (cw) { if (a1 >= a0) a1 -= Math.PI * 2; } else { if (a1 <= a0) a1 += Math.PI * 2; }
      const sweep = a1 - a0;
      const steps = Math.max(6, Math.min(2000, Math.floor(Math.abs(sweep) * r / 2)));
      let px = cur.x, py = cur.y;
      for (let k = 1; k <= steps; k++) {
        const ang = a0 + sweep * (k / steps);
        const nx = cx + r * Math.cos(ang);
        const ny = cy + r * Math.sin(ang);
        const a: [number, number] = [px, py];
        const b: [number, number] = [nx, ny];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 0) segs.push({ a, b, len, feed: curFeed, rapid: false });
        px = nx; py = ny;
      }
      cur.x = tx; cur.y = ty;
      continue;
    }
  }

  // bbox + total (only over all segments regardless of type)
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
function makeFitter(b: BBox, W: number, H: number, pad = 0) {
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

// Strict segment/segment intersection (not touching endpoints)
function segIntersect(a: [number, number], b: [number, number], c: [number, number], d: [number, number]) {
  const ax = a[0], ay = a[1], bx = b[0], by = b[1];
  const cx = c[0], cy = c[1], dx = d[0], dy = d[1];
  const rpx = bx - ax, rpy = by - ay;
  const spx = dx - cx, spy = dy - cy;
  const denom = rpx * spy - rpy * spx;
  if (Math.abs(denom) < 1e-9) return null; // parallel or collinear
  const t = ((cx - ax) * spy - (cy - ay) * spx) / denom;
  const u = ((cx - ax) * rpy - (cy - ay) * rpx) / denom;
  if (t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98) return { t, u };
  return null;
}

// Mark later segments that cross any earlier segment at a real angle
function markCrossingSegs(segs: Seg[], minAngleDeg = 20) {
  const cosTol = Math.cos((minAngleDeg * Math.PI) / 180);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const v1x = s.b[0] - s.a[0], v1y = s.b[1] - s.a[1];
    const v1n = Math.hypot(v1x, v1y) || 1;
    for (let j = 0; j < i - 1; j++) {
      const t = segs[j];
      const hit = segIntersect(s.a, s.b, t.a, t.b);
      if (!hit) continue;
      const v2x = t.b[0] - t.a[0], v2y = t.b[1] - t.a[1];
      const v2n = Math.hypot(v2x, v2y) || 1;
      const dot = (v1x * v2x + v1y * v2y) / (v1n * v2n);
      if (Math.abs(dot) < cosTol) { s.hidden = true; break; }
    }
  }
  return segs;
}

/* =========================
   Multi-laser overlay (absolute space) with particles + audio
========================= */
function MultiLaserOverlayAbsolute({
  active,
  targets,
  durationMs = 4000,
  anchorRef,
  onDone,
  onDebug,
}: {
  active: boolean;
  targets: Array<{ segs: Seg[] | null; bbox: BBox | null }>;
  durationMs?: number;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  onDone: () => void;
  onDebug?: (msg: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Particles (sparks & embers)
  type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; hot: boolean };
  const partsRef = useRef<P[]>([]);

  // Audio (global)
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const cutAudioRef = useRef<HTMLAudioElement | null>(null);
  // Two extra tracks for the first two INC files
  const incAudioRefs = useRef<Array<HTMLAudioElement | null>>([null, null]);

  const audioReadyRef = useRef<boolean>(false);

  // feed stats (to detect "high speed")
  const feedMinMax = useMemo(() => {
    let min = +Infinity, max = -Infinity, any = false;
    for (const t of targets) {
      for (const s of t.segs || []) {
        if (s.feed && !s.rapid) { min = Math.min(min, s.feed); max = Math.max(max, s.feed); any = true; }
      }
    }
    if (!any) return null;
    return { min, max };
  }, [targets]);

  // Report feed stats when available
  useEffect(() => {
    if (feedMinMax) {
      onDebug?.(`Laser feed stats: min=${feedMinMax.min.toFixed(0)}, max=${feedMinMax.max.toFixed(0)}`);
    }
  }, [feedMinMax]);

  // Drawing options
  const SKIP_TOO_FAST = true; // optionally hide segments with very high feed
  const FAST_FEED_NORM = 0.75; // normalized feed threshold considered "too fast"

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

  // prepare audio (use files from /public root)
  useEffect(() => {
    if (!active) return;

    if (!moveAudioRef.current) {
      moveAudioRef.current = new Audio("/sounds/laser_move.mp3");
      moveAudioRef.current.loop = true;
      moveAudioRef.current.volume = 0;
    }
    if (!cutAudioRef.current) {
      cutAudioRef.current = new Audio("/sounds/laser_cut.mp3");
      cutAudioRef.current.loop = true;
      cutAudioRef.current.volume = 0;
    }
    // Per-INC (1 & 2) use the same cut file from public
    if (!incAudioRefs.current[0]) {
      incAudioRefs.current[0] = new Audio("/sounds//laser_cut.mp3");
      incAudioRefs.current[0].loop = true;
      incAudioRefs.current[0].volume = 0;
    }
    if (!incAudioRefs.current[1]) {
      incAudioRefs.current[1] = new Audio("/sounds/laser_cut.mp3");
      incAudioRefs.current[1].loop = true;
      incAudioRefs.current[1].volume = 0;
    }

    const tryPlay = async () => {
      try {
        await moveAudioRef.current!.play();
        await cutAudioRef.current!.play();
        await incAudioRefs.current[0]!.play();
        await incAudioRefs.current[1]!.play();
        audioReadyRef.current = true;
        onDebug?.("Laser audio ready (autoplay)");
      } catch {
        audioReadyRef.current = false;
        onDebug?.("Laser audio blocked by autoplay policy; waiting for user gesture");
      }
    };
    tryPlay();

    // retry on first user gesture if blocked
    const resume = () => {
      if (audioReadyRef.current) return;
      moveAudioRef.current?.play().catch(() => {});
      cutAudioRef.current?.play().catch(() => {});
      incAudioRefs.current[0]?.play().catch(() => {});
      incAudioRefs.current[1]?.play().catch(() => {});
      audioReadyRef.current = true;
      onDebug?.("Laser audio resumed after user interaction");
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("scroll", resume, { capture: true } as any);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    window.addEventListener("scroll", resume, { once: true, capture: true } as any);

    return () => {
      moveAudioRef.current?.pause();
      cutAudioRef.current?.pause();
      incAudioRefs.current[0]?.pause();
      incAudioRefs.current[1]?.pause();

      if (moveAudioRef.current) moveAudioRef.current.currentTime = 0;
      if (cutAudioRef.current) cutAudioRef.current.currentTime = 0;
      if (incAudioRefs.current[0]) incAudioRefs.current[0]!.currentTime = 0;
      if (incAudioRefs.current[1]) incAudioRefs.current[1]!.currentTime = 0;
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      return;
    }

    fitCanvasDPR();
    const c = ref.current!;
    const ctx = c.getContext("2d")!;

    // Filter out non-drawing segments (G0 rapids and optionally too-fast feeds)
    const normFeed = (s: Seg) => {
      if (!feedMinMax || !s.feed) return 0.5;
      if (feedMinMax.max <= feedMinMax.min) return 0.5;
      return clamp01((s.feed - feedMinMax.min) / (feedMinMax.max - feedMinMax.min));
    };
    const isSkipped = (s: Seg) => s.hidden || s.rapid || (SKIP_TOO_FAST && normFeed(s) >= FAST_FEED_NORM);
    const drawSegsArr = targets.map(t => (t.segs || []).filter(s => !isSkipped(s)));
    const totals = drawSegsArr.map(segs => segs.reduce((a, s) => a + s.len, 0));
    const anySegs = totals.some(t => t > 0);
    const worldBBox = SHEET_BBOX;

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
      const dt = 0.016;

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
        return { x: 0, y: 0, w: c.clientWidth, h: c.clientHeight };
      })();

      ctx.clearRect(0, 0, c.width, c.height);

      const baseFit = makeFitter(worldBBox, fitRect.w, fitRect.h, 0);
      const fit = (p: [number, number]) => {
        const r = baseFit(p);
        return [r[0] + fitRect.x, r[1] + fitRect.y] as [number, number];
      };

      // find per-target tip & feed so we can drive audio / sparks
      let anyCutting = false;
      let anyMoving = false;

      // track which of the first two INCs are actively cutting
      const incCuttingFlags: boolean[] = [false, false];

      for (let i = 0; i < targets.length; i++) {
        const segs = drawSegsArr[i] || [];
        const total = totals[i] || 0;
        if (!segs.length || total <= 0) continue;

        const progLen = total * progress;

        // Determine current segment & whether it's "fast"
        let acc = 0;
        let curSeg: Seg | null = null;
        for (const s of segs) {
          if (acc + s.len >= progLen) { curSeg = s; break; }
          acc += s.len;
        }
        const isFast = (s: Seg | null) => s ? isSkipped(s) : false;

        function drawPartial(seg: Seg, fromLen: number, toLen: number) {
          const t0 = fromLen / seg.len, t1 = toLen / seg.len;
          const p0_ = fit([seg.a[0] + (seg.b[0] - seg.a[0]) * t0, seg.a[1] + (seg.b[1] - seg.a[1]) * t0]);
          const p1_ = fit([seg.a[0] + (seg.b[0] - seg.a[0]) * t1, seg.a[1] + (seg.b[1] - seg.a[1]) * t1]);
          ctx.moveTo(p0_[0], p0_[1]);
          ctx.lineTo(p1_[0], p1_[1]);
        }

        const hotWindow = 0.06 * total;
        const coolEnd = Math.max(0, progLen - hotWindow);

        // cooled trail (skip fast segments)
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(40,45,55,0.9)";
        ctx.beginPath();
        let remainCool = coolEnd;
        for (const s of segs) {
          if (remainCool <= 0) break;
          if (isFast(s)) { remainCool -= s.len; continue; }
          const use = Math.min(remainCool, s.len);
          drawPartial(s, 0, use);
          remainCool -= use;
        }
        ctx.stroke();
        ctx.restore();

        // hot trail (skip fast segments)
        ctx.save();
        const HOT_BASE = 2.6;
        ctx.lineWidth = HOT_BASE;
        ctx.strokeStyle = "#ff8c3a";
        ctx.shadowColor = "#ff8c3a";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        let remainHot = progLen - coolEnd;
        let pos = coolEnd;
        for (const s of segs) {
          if (pos >= s.len) { pos -= s.len; continue; }
          const use = Math.min(remainHot, s.len - pos);
          if (!isFast(s)) drawPartial(s, pos, pos + use);
          remainHot -= use;
          pos = 0;
          if (remainHot <= 0) break;
        }
        ctx.stroke();
        ctx.restore();

        // tip glow + sparks
        function pointAtLen(L: number) {
          let acc2 = 0;
          for (const s of segs) {
            if (acc2 + s.len >= L) {
              const t = (L - acc2) / s.len;
              return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t] as [number, number];
            }
            acc2 += s.len;
          }
          const last = segs[segs.length - 1];
          return last ? last.b : ([0, 0] as [number, number]);
        }
        const tipW = pointAtLen(progLen);
        const tip = fit(tipW);

        const cuttingNow = !!curSeg && !isFast(curSeg) && !curSeg.rapid;
        const movingFast = !!curSeg && isFast(curSeg);

        anyCutting = anyCutting || cuttingNow;
        anyMoving = anyMoving || movingFast;

        if (i === 0) incCuttingFlags[0] = cuttingNow;
        if (i === 1) incCuttingFlags[1] = cuttingNow;

        const feedN = curSeg ? (curSeg.rapid ? 1 : normFeed(curSeg)) : 0.5;
        const slowFactor = 1 - feedN;
        const bloomR = 12 + 26 * slowFactor;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], bloomR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,140,58,${0.18 + 0.25 * slowFactor})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], bloomR * 1.35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,180,120,${0.08 + 0.12 * slowFactor})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // sparks
        const baseSparks = cuttingNow ? (2 + Math.floor(5 * slowFactor)) : 0;
        for (let s = 0; s < baseSparks; s++) {
          const ang = (Math.random() * Math.PI) - Math.PI / 2;
          const sp = 70 + Math.random() * 140 * (0.5 + slowFactor);
          partsRef.current.push({
            x: tip[0],
            y: tip[1],
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 30,
            life: 0,
            max: 0.35 + Math.random() * 0.5,
            size: 1.2 + Math.random() * 1.6,
            hot: true,
          });
        }
        if (cuttingNow && Math.random() < (0.03 + 0.05 * slowFactor)) {
          const bursts = 10 + Math.floor(Math.random() * 12);
          for (let b = 0; b < bursts; b++) {
            const ang = Math.random() * Math.PI - Math.PI / 2;
            const sp = 160 + Math.random() * 260;
            partsRef.current.push({
              x: tip[0],
              y: tip[1],
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - 40,
              life: 0,
              max: 0.25 + Math.random() * 0.45,
              size: 1.2 + Math.random() * 1.4,
              hot: true,
            });
          }
        }
      }

      // draw particles (gravity + fade)
      const g = 320; // px/s^2
      const arr = partsRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += dt;
        if (p.life > p.max) { arr.splice(i, 1); continue; }
        p.vy += g * dt * 0.15;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const t = p.life / p.max;
        const alpha = p.hot ? (1 - t) : (0.6 * (1 - t));
        const size = p.size * (1 + 0.6 * (1 - t));
        const col = p.hot ? `rgba(255,170,60,${alpha})` : `rgba(200,120,60,${alpha})`;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.restore();

        if (p.hot && p.life > p.max * 0.5) p.hot = false;
      }

      // audio mix (global) + per-INC volumes
      const cutVol = anyCutting ? 0.6 : 0;
      const moveVol = anyMoving ? 0.5 : 0;
      if (cutAudioRef.current) cutAudioRef.current.volume = 0;
      if (moveAudioRef.current) moveAudioRef.current.volume = 0;

      if (incAudioRefs.current[0]) incAudioRefs.current[0]!.volume = anyCutting ? 0.7 : 0;
      if (incAudioRefs.current[1]) incAudioRefs.current[1]!.volume = anyCutting ? 0.7 : 0;

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
      partsRef.current = [];
      if (cutAudioRef.current) cutAudioRef.current.volume = 0;
      if (moveAudioRef.current) moveAudioRef.current.volume = 0;
      if (incAudioRefs.current[0]) incAudioRefs.current[0]!.volume = 0;
      if (incAudioRefs.current[1]) incAudioRefs.current[1]!.volume = 0;
    };
  }, [active, targets, durationMs, anchorRef, feedMinMax, onDone]);

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
  // Access to Three.js scene inside ThreeModel
  const modelRef = useRef<ThreeModelHandle | null>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [vp, setVp] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  // Derived from scroll (bidirectional)
  const [rowProgress, setRowProgress] = useState(0); // 0..1
  const [openingWidthVW, setOpeningWidthVW] = useState(0);
  const [unveilScale, setUnveilScale] = useState(1);

  // NEW: handle to drive drops via scene access
  const [phase, setPhase] = useState<
    "idle" | "laser" | "waiting-permission" | "dropping" | "done"
  >("idle");

  const [debugLines, setDebugLines] = useState<string[]>([]);
  const pushDbg = (s: string) =>
    setDebugLines((arr) => [...arr.slice(-60), `[${new Date().toLocaleTimeString()}] ${s}`]);

  // Configuration for future dropping logic
  type Axis = 'y' | 'z';
  const DROP_AXIS: Axis = 'y';
  const FLOOR_POS = 0;            // static floor plane position
  const DROP_GRAVITY = 3800;      // units/s^2 in GLB world
  const DROP_DAMPING = 0.14;      // legacy param (not used by Rapier)
  const DROP_INTERVAL_MS = 320;   // delay between successive object spawns
  const MAX_DROP_TIME_MS = 8000;  // safety cap per object (still used for logging)
  const WORLD_H = 1900;           // from fitBBox (ymax - ymin)
  const PHYS_DT = 1 / 60;

  // Queue for per-object permissioned drops
  const dropQueueRef = useRef<THREE.Mesh[]>([]);
  const dropIndexRef = useRef(0);
  const [canDropNext, setCanDropNext] = useState(false);
  const [dropTotal, setDropTotal] = useState(0);

  // Utility: traverse and collect candidate "solid" meshes
  function collectDroppableMeshes(root: THREE.Object3D): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    root.traverse((o: any) => {
      if (o?.isMesh && o.visible !== false) {
        const g = o.geometry;
        if (!g) return;
        out.push(o);
      }
    });
    return out;
  }

  // Compute world-space bbox height & set initial velocity
  function prepareMeshForDrop(mesh: THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const height = size.y || 1;
    (mesh as any).__vy = 0;
    (mesh as any).__dropping = true;
    (mesh as any).__height = height;
  }

  // Rapier physics (lazy) refs
  const rapierRef = useRef<any>(null);
  const worldRef = useRef<any>(null);
  const rafPhysRef = useRef<number>(0);
  const accRef = useRef(0);
  const meshToBodyRef = useRef<Map<THREE.Mesh, any>>(new Map());
  const bodySleepRef = useRef<Map<any, number>>(new Map());
  const floorAddedRef = useRef(false);

  async function ensurePhysicsWorld() {
    if (!rapierRef.current) {
      const Rapier = await import("@dimforge/rapier3d-compat");
      await (Rapier as any).init();
      rapierRef.current = Rapier;
    }
    if (!worldRef.current) {
      const Rapier = rapierRef.current;
      const gravity = DROP_AXIS === 'y' ? { x: 0, y: -DROP_GRAVITY, z: 0 } : { x: 0, y: 0, z: -DROP_GRAVITY };
      worldRef.current = new Rapier.World(gravity);
      floorAddedRef.current = false;
      startPhysicsLoop();
      pushDbg("Physics world initialized.");
    }
    if (!floorAddedRef.current) {
      const Rapier = rapierRef.current;
      const floorBody = worldRef.current.createRigidBody(Rapier.RigidBodyDesc.fixed());
      const floorCol = DROP_AXIS === 'y'
        ? Rapier.ColliderDesc.cuboid(10000, 1, 10000).setTranslation(0, FLOOR_POS - 1, 0)
        : Rapier.ColliderDesc.cuboid(10000, 10000, 1).setTranslation(0, 0, FLOOR_POS - 1);
      worldRef.current.createCollider(floorCol, floorBody);
      floorAddedRef.current = true;
      pushDbg("Floor collider added.");
    }
  }

  function startPhysicsLoop() {
    cancelAnimationFrame(rafPhysRef.current);
    accRef.current = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      accRef.current += dt;
      const world = worldRef.current;
      if (world) {
        while (accRef.current >= PHYS_DT) {
          world.step();
          accRef.current -= PHYS_DT;
        }
        // Sync meshes (respect parent transforms) and detect settling
        meshToBodyRef.current.forEach((rb, mesh) => {
          const t = rb.translation();
          const r = rb.rotation();
          const worldMat = new THREE.Matrix4().compose(
            new THREE.Vector3(t.x, t.y, t.z),
            new THREE.Quaternion(r.x, r.y, r.z, r.w),
            mesh.scale.clone() // keep current local scale
          );
          if (mesh.parent) {
            const parentInv = new THREE.Matrix4().copy(mesh.parent.matrixWorld).invert();
            const localMat = new THREE.Matrix4().multiplyMatrices(parentInv, worldMat);
            const pos = new THREE.Vector3();
            const quat = new THREE.Quaternion();
            const scl = new THREE.Vector3();
            localMat.decompose(pos, quat, scl);
            mesh.position.copy(pos);
            mesh.quaternion.copy(quat);
          } else {
            mesh.position.set(t.x, t.y, t.z);
            mesh.quaternion.set(r.x, r.y, r.z, r.w);
          }
          const lin = rb.linvel();
          const ang = rb.angvel();
          const ls = Math.hypot(lin.x, lin.y, lin.z);
          const as = Math.hypot(ang.x, ang.y, ang.z);
          let slept = bodySleepRef.current.get(rb) || 0;
          if (ls < 0.2 && as < 0.2) slept += PHYS_DT; else slept = 0;
          bodySleepRef.current.set(rb, slept);
        });
      }
      (modelRef.current as any)?.requestRender?.();
      rafPhysRef.current = requestAnimationFrame(step);
    };
    rafPhysRef.current = requestAnimationFrame(step);
  }

  // Cleanup physics on unmount
  useEffect(() => {
    return () => {
      try { cancelAnimationFrame(rafPhysRef.current); } catch {}
      meshToBodyRef.current.clear();
      bodySleepRef.current.clear();
      worldRef.current = null;
    };
  }, []);

  // Build queue and wait for per-object permission
  async function startDroppingSequence() {
    const scene = modelRef.current?.getScene();
    if (!scene) {
      pushDbg("No scene yet; cannot drop.");
      return;
    }

    setPhase("dropping");
    pushDbg("Starting drop sequence…");

    // Choose largest group by descendant count as model root
    let modelRoot: THREE.Object3D | null = null;
    let maxCount = -1;
    for (const child of scene.children) {
      let count = 0;
      child.traverse(() => count++);
      if (count > maxCount) {
        maxCount = count;
        modelRoot = child;
      }
    }
    if (!modelRoot) {
      pushDbg("Model root not found.");
      return;
    }

    const meshes = collectDroppableMeshes(modelRoot);
    pushDbg(`Collected ${meshes.length} meshes to drop.`);

    const sized = meshes.map((m) => {
      const box = new THREE.Box3().setFromObject(m);
      return { m, h: box.getSize(new THREE.Vector3()).y };
    });
    sized.sort((a, b) => b.h - a.h);

    // Exclude frame-1 solid object from dropping
    const excludeRe = /^(frame[-_]?1)$/i;
    const filtered = sized.filter(({ m }) => !excludeRe.test(m.name || ""));
    if (filtered.length !== sized.length) {
      pushDbg(`Excluded ${sized.length - filtered.length} mesh(es) by name (frame-1).`);
    }

    dropQueueRef.current = filtered.map((s) => s.m);
    dropIndexRef.current = 0;
    setDropTotal(dropQueueRef.current.length);
    setCanDropNext(true);
    pushDbg(`Ready: click 'Drop next object' to start [1/${dropQueueRef.current.length}]`);
  }

  // Trigger a single object drop; called by HUD button per permission
  async function dropNextObject() {
    const i = dropIndexRef.current;
    const arr = dropQueueRef.current;
    if (!arr.length || i >= arr.length) return;
    const mesh = arr[i];
    setCanDropNext(false);
    await ensurePhysicsWorld();
    prepareMeshForDrop(mesh);
    const Rapier = rapierRef.current;
    const world = worldRef.current;
    // Compute world bbox center and half extents
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const half = size.clone().multiplyScalar(0.5);
    // Spawn body above by small offset and with small random velocities
    const offset = 10;
    const tx = center.x + (DROP_AXIS === 'z' ? 0 : 0);
    const ty = center.y + (DROP_AXIS === 'y' ? offset : 0);
    const tz = center.z + (DROP_AXIS === 'z' ? offset : 0);
    const rbDesc = Rapier.RigidBodyDesc.dynamic()
      .setTranslation(tx, ty, tz)
      .setRotation(mesh.quaternion)
      .setLinearDamping(0.1)
      .setAngularDamping(0.7)
      .setCcdEnabled(true);
    const rb = world.createRigidBody(rbDesc);
    const colDesc = Rapier.ColliderDesc.cuboid(
      Math.max(half.x, 2),
      Math.max(half.y, 2),
      Math.max(half.z, 2)
    )
      .setFriction(0.9)
      .setRestitution(0.2)
      .setDensity(1.0);
    world.createCollider(colDesc, rb);
    // tiny random angular & lateral velocity
    const rand = () => (Math.random() - 0.5) * 2;
    const ang = { x: 0.5 * rand(), y: 0.5 * rand(), z: 0.5 * rand() };
    const lat = { x: 5 * rand(), y: 5 * rand(), z: 5 * rand() };
    rb.setAngvel(ang, true);
    rb.setLinvel(lat, true);
    meshToBodyRef.current.set(mesh, rb);
    bodySleepRef.current.set(rb, 0);
    pushDbg(`Spawned body for '${mesh.name || mesh.uuid}' with half=(${half.x.toFixed(1)},${half.y.toFixed(1)},${half.z.toFixed(1)})`);
    // Wait until settled (~0.5s below thresholds)
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const check = () => {
        const slept = bodySleepRef.current.get(rb) || 0;
        if (slept >= 0.5) { resolve(); return; }
        if (performance.now() - start > MAX_DROP_TIME_MS) { pushDbg(`Timeout: forcing settle '${mesh.name || mesh.uuid}'.`); resolve(); return; }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    pushDbg(`Settled '${mesh.name || mesh.uuid}'.`);
    dropIndexRef.current = i + 1;
    if (dropIndexRef.current < arr.length) {
      await new Promise((r) => setTimeout(r, DROP_INTERVAL_MS));
      setCanDropNext(true);
      pushDbg(`Ready for next [${dropIndexRef.current + 1}/${arr.length}].`);
    } else {
      pushDbg("All objects settled. Releasing scroll.");
      unlockScroll(lockYRef.current);
      setScrollLocked(false);
      setPhase("done");
    }
  }

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
            markCrossingSegs(segs, 20);
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
          markCrossingSegs(segs, 20);
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
      pushDbg("Scroll locked (pre-laser).");
      setLaserActive(true);
      setPhase("laser");
      pushDbg("Laser started.");
    }
  }, [openingWidthVW, laserActive, laserDone]);

  // Do NOT unlock scroll on laser end; scroll is released after drops finish

  const worldBBox = useMemo(() => SHEET_BBOX, []);
  const ratio = useMemo(() => {
    if (!worldBBox) return 2; // fallback
    const w = worldBBox.xmax - worldBBox.xmin;
    const h = worldBBox.ymax - worldBBox.ymin || 1;
    return Math.max(0.2, Math.min(5, w / h));
  }, [worldBBox]);

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
    const { t } = useI18n();
    switch (id) {
      case "test1": return t("Testimonials.quotes.test1");
      case "test2": return t("Testimonials.quotes.test2");
      case "test3": return t("Testimonials.quotes.test3");
      case "test5": return t("Testimonials.quotes.test5");
      case "test6": return t("Testimonials.quotes.test6");
      case "test7": return t("Testimonials.quotes.test7");
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
          durationMs={4000}
          anchorRef={glbBoxRef}
          onDone={() => {
            setLaserActive(false);
            setLaserDone(true);
            // Keep tiskre.glb visible; do not switch to frame yet
            pushDbg("Laser finished.");
            setPhase("waiting-permission");
          }}
          onDebug={(m) => pushDbg(m)}
        />

        {/* === DEBUG HUD & CONTROLS === */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 60,
            width: "min(36vw, 520px)",
            maxHeight: "42vh",
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "auto",
            backdropFilter: "blur(3px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900, letterSpacing: ".02em" }}>TestimoniesAbout — DEBUG</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              phase: <b>{phase}</b>
              {scrollLocked ? " · scroll:locked" : " · scroll:free"}
            </div>
          </div>

          {phase === "waiting-permission" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  startDroppingSequence();
                }}
                style={{ padding: "8px 12px", fontWeight: 800, borderRadius: 8, border: "1px solid #ccc", background: "#16a34a", color: "#fff" }}
              >
                ✅ Start dropping objects
              </button>
              <button
                onClick={() => {
                  // Emergency release without dropping
                  unlockScroll(lockYRef.current);
                  setScrollLocked(false);
                  setPhase("done");
                  pushDbg("Scroll manually released by user.");
                }}
                style={{ padding: "8px 12px", fontWeight: 800, borderRadius: 8, border: "1px solid #ccc", background: "#6b7280", color: "#fff" }}
              >
                🧯 Skip & release scroll
              </button>
            </div>
          )}

          {phase === "dropping" && (
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
              Dropping objects… One by one onto floor (axis={DROP_AXIS}, pos={FLOOR_POS}). Gravity={DROP_GRAVITY}
            </div>
          )}

          {phase === "dropping" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={!canDropNext}
                onClick={() => dropNextObject()}
                style={{ padding: "8px 12px", fontWeight: 800, borderRadius: 8, border: "1px solid #ccc", background: canDropNext ? "#0ea5e9" : "#64748b", color: "#fff", cursor: canDropNext ? "pointer" : "not-allowed" }}
              >
                ⬇️ Drop next object {dropIndexRef.current + 1}/{dropTotal}
              </button>
            </div>
          )}

          <div
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 12,
              lineHeight: 1.25,
              whiteSpace: "pre-wrap",
              overflow: "auto",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 8,
              padding: 8,
              maxHeight: "28vh",
            }}
          >
            {debugLines.length ? debugLines.map((ln, i) => <div key={i}>{ln}</div>) : "— no logs yet —"}
          </div>
        </div>

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
                {/* GLB box locked to 4500:1900 (INC world) */}
                <div
                  ref={glbBoxRef}
                  style={{
                    position: "relative",
                    width: "min(1100px, 92vw)",
                    aspectRatio: "4500 / 1900",
                    margin: "0 auto",
                    overflow: "visible",
                    transform: `translateY(-250px) scale(${(1.3 * 0.97).toFixed(2)})`,
                    transformOrigin: "center top",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0 }}>
                    <ThreeModel
                      ref={modelRef}
                      modelPath={showFrame ? "/about/frame.glb" : "/about/tiskre.glb"}
                      height={"100%"}
                      flat
                      fitBBox={{ xmin: 0, ymin: 0, xmax: 4500, ymax: 1900 }}
                    />
                  </div>
                </div>

                {/* Photos row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2vw", width: "100%", transform: "translateY(0px)" }}>
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
            <RowText centerLeftVW={row1TextCenter} text={useI18n().t(TOP_TEXT_KEY)} />
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
            <RowText centerLeftVW={row2TextCenter} text={useI18n().t(BOT_TEXT_KEY)} />
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
  const { t } = useI18n();
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
