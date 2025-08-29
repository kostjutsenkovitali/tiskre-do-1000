// src/components/Hexagon.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { bus } from "@/utils/visibilityBus";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

/* =========================================================
   Types
   ========================================================= */
type WpPost = {
  id: number;
  title: { rendered: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  link?: string;
  _embedded?: { ["wp:featuredmedia"]?: Array<{ source_url?: string }> };
};
type Slide = {
  id: number;
  title: string;
  quote: string;
  imageUrl: string;
  url: string;
};

/* =========================================================
   Config
   ========================================================= */
// Vertical gradient from #f8f8f8 (top) to #b8c8c8 (bottom)
const GRADIENT_BG = "linear-gradient(to bottom, #f8f8f8 0%, #b8c8c8 100%)";

const FRAME_COLOR = "#9ca3af";
const FRAME_THICKNESS_PX = 4;
const PIN_DURATION_MS = 5000;
const SHOW_DEBUG_ORBIT = false;

// 3× bigger object (3D payload)
const OBJECT_SCALE_MULT = 3;

// posts order (drives which posts we fetch)
const PERMALINKS = [
  "https://tiskre-do.eu/the-best-hair-style-in-the-summer-2018/",
  "https://tiskre-do.eu/how-to-decorate-the-new-design-projects/",
  "https://tiskre-do.eu/gold-jewelry-trends/",
  "https://tiskre-do.eu/inspiration-for-unique-sandy-color-design/",
];

/* =========================================================
   Tiny helpers for HTML content
   ========================================================= */
const LABEL_STYLE = {
  color: "white",
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase" as const,
};
const TITLE_STYLE = { color: "white", fontWeight: 800, lineHeight: 1.1 };
const QUOTE_STYLE = { color: "white", fontWeight: 500, lineHeight: 1.35 };

/* =========================================================
   Debug (optional)
   ========================================================= */
function OrbitDebug({
  a, b, y, onChange,
}: {
  a: number; b: number; y: number;
  onChange: (a: number, b: number, y: number) => void;
}) {
  if (!SHOW_DEBUG_ORBIT) return null;
  return (
    <div style={{
      position: "fixed", right: 12, top: 12, zIndex: 4000, padding: 12,
      background: "rgba(15,15,15,0.9)", color: "#fff", borderRadius: 12,
      fontFamily: "monospace", fontSize: 12
    }}>
      <div style={{ marginBottom: 8, opacity: 0.85 }}>3D ORBIT</div>
      <label style={{ display: "block", marginBottom: 8 }}>
        a = {a.toFixed(1)}
        <input type="range" min={1} max={30} step={0.1} value={a}
          onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value), b, y)}
          style={{ width: 200 }} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        b = {b.toFixed(1)}
        <input type="range" min={1} max={30} step={0.1} value={b}
          onChange={(e) => onChange(a, parseFloat((e.target as HTMLInputElement).value), y)}
          style={{ width: 200 }} />
      </label>
      <label style={{ display: "block" }}>
        y (base) = {y.toFixed(2)}
        <input type="range" min={-6} max={6} step={0.05} value={y}
          onChange={(e) => onChange(a, b, parseFloat((e.target as HTMLInputElement).value))}
          style={{ width: 200 }} />
      </label>
    </div>
  );
}

/* =========================================================
   Component
   ========================================================= */
export default function Hexagon() {
  const sizingVars = { "--s": "clamp(240px, 40vmin, 600px)", "--scale": 1.2 } as CSSProperties;

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [index, setIndex] = useState(0);

  const [pinned, setPinned] = useState(false);
  const recentlyUnpinned = useRef<boolean>(false);
  const unpinnedTime = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // orbit params
  const [orbitParams, setOrbitParams] = useState({ a: 20, b: 14.6, yOffset: -3.1 });
  const orbitParamsRef = useRef(orbitParams);
  useEffect(() => { orbitParamsRef.current = orbitParams; }, [orbitParams]);

  // Active ONLY when this section or footer visible
  const [hexVisible, setHexVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = hexVisible || footerVisible;
    if (canvasRef.current) {
      canvasRef.current.style.opacity = activeRef.current ? "1" : "0";
    }
    // Notify footer reveal only when Hexagon itself becomes visible
    bus.emit("footer:reveal", hexVisible === true);
  }, [hexVisible, footerVisible]);

  /* ===== fetch posts ===== */
  useEffect(() => {
    let cancelled = false;
    const slugFromUrl = (url: string) => {
      try {
        const u = new URL(url);
        const parts = u.pathname.replace(/^\/|\/$/g, "").split("/");
        return parts[parts.length - 1] || "";
      } catch { return ""; }
    };
    async function fetchOneBySlug(slug: string, fallbackUrl: string): Promise<Slide | null> {
      if (!slug) return null;
      try {
        const res = await fetch(
          `https://tiskre-do.eu/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
          { cache: "no-store" }
        );
        if (!res.ok) return null;
        const arr: WpPost[] = await res.json();
        const p = arr?.[0]; if (!p) return null;
        const title = stripHtml(p.title?.rendered || "").trim() || "Untitled";
        const html = p.excerpt?.rendered || p.content?.rendered || "";
        const quote = truncateForQuote(stripHtml(html));
        const imageUrl = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "/placeholder.jpg";
        const url = p.link || fallbackUrl;
        return { id: p.id, title, quote, imageUrl, url };
      } catch { return null; }
    }
    (async () => {
      const slugs = PERMALINKS.map(slugFromUrl);
      const results = await Promise.all(slugs.map((s, i) => fetchOneBySlug(s, PERMALINKS[i])));
      const cleaned = results.map((s, i) => s ?? fallbackFromUrl(PERMALINKS[i])).slice(0, 4);
      if (!cancelled) setSlides(cleaned);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!slides || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides]);

  const current = useMemo(
    () => (!slides || !slides.length) ? null : slides[index % slides.length],
    [slides, index]
  );

  /* ===== pin logic ===== */
  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      const e = entries[0]; if (!e) return; const fully = e.intersectionRatio >= 0.95;
      const timeSinceUnpin = Date.now() - unpinnedTime.current;
      const blockRepin = recentlyUnpinned.current && timeSinceUnpin < 2000;
      if (fully && !pinned && !blockRepin) {
        lockScroll(); setPinned(true);
        const timeoutId = setTimeout(() => {
          setPinned(false); unlockScroll(); recentlyUnpinned.current = true; unpinnedTime.current = Date.now();
        }, PIN_DURATION_MS);
        return () => clearTimeout(timeoutId);
      } else if (!fully && pinned) {
        unlockScroll(); setPinned(false); recentlyUnpinned.current = true; unpinnedTime.current = Date.now();
      }
      if (!fully && recentlyUnpinned.current && timeSinceUnpin > 2000) { recentlyUnpinned.current = false; }
    }, { threshold: [0, 0.95, 1], rootMargin: "50px 0px" });

    observerRef.current.observe(el);
    return () => { observerRef.current?.disconnect(); unlockScroll(); };
  }, [pinned]);

  // Visibility watchers: section + footer
  useEffect(() => {
    const sec = sectionRef.current;
    const footer = document.querySelector<HTMLElement>("footer");
    if (!sec) return;

    const opts: IntersectionObserverInit = { threshold: 0.1 };
    const ob1 = new IntersectionObserver(([entry]) => setHexVisible(!!entry?.isIntersecting), opts);
    ob1.observe(sec);

    let ob2: IntersectionObserver | null = null;
    if (footer) {
      ob2 = new IntersectionObserver(([entry]) => setFooterVisible(!!entry?.isIntersecting), opts);
      ob2.observe(footer);
    }
    return () => { ob1.disconnect(); ob2?.disconnect(); };
  }, []);

  /* =========================================================
     THREE SCENE
     ========================================================= */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

    // Renderer (use layout viewport width to avoid 100vw scrollbar issue)
    const getW = () => document.documentElement.clientWidth || window.innerWidth;
    const getH = () => window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getW(), getH(), false);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, getW() / getH(), 0.1, 1000);
    camera.position.set(0, 0, 22);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(8, 10, 6);
    scene.add(dirLight);

    // Orbit groups
    const orbitPlane = new THREE.Group(); scene.add(orbitPlane);
    const flyer = new THREE.Group(); orbitPlane.add(flyer);
    const payload = new THREE.Group(); flyer.add(payload);

    // Dummy mesh (replaced by GLB when loaded)
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xdfe7ff, metalness: 0.2, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.5, roughness: 0.6 });
    const shuttle = new THREE.Group();
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 8, 16), hullMat); fuselage.rotation.z = Math.PI / 2; shuttle.add(fuselage);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.35, 20), darkMat); nose.position.x = 0.6; nose.rotation.z = -Math.PI / 2; shuttle.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 16), darkMat); tail.position.x = -0.6; tail.rotation.z = Math.PI / 2; shuttle.add(tail);
    payload.add(shuttle);

    // GLB load
    try {
      const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
      loader.load(
        "/hexagon/hex.glb",
        (gltf) => {
          const model = gltf.scene as THREE.Group;
          model.traverse((o: any) => {
            if (o.isMesh) { o.frustumCulled = false; if (o.material && 'side' in o.material) o.material.side = THREE.DoubleSide; }
          });
          // normalize and face +X
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3(); box.getSize(size);
          const s = 1.2 / Math.max(size.x, size.y, size.z, 1);
          model.scale.setScalar(s * 1.15);
          model.rotation.y = Math.PI / 2;
          payload.add(model);
          shuttle.visible = false;
        },
        undefined as unknown as (e: ProgressEvent) => void,
        (err) => { console.warn("GLB load failed:", err); }
      );
    } catch (e) { console.error(e); }

    // Resize (use layout viewport width)
    const onResize = () => {
      const w = getW(), h = getH();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    // Helpers
    const pxToWorldY = (px: number) => {
      const dist = camera.position.z;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const worldH = 2 * Math.tan(vFov / 2) * dist;
      return (px / (window.innerHeight || 1)) * worldH;
    };

    // Animate
    const clock = new THREE.Clock();
    const REV_RATE = 0.0625; // rev/s
    let t = 0;
    let rafId = 0;

    const animate = () => {
      const dt = clock.getDelta();

      // Only advance when section or footer visible
      const active = activeRef.current;

      // Orbit math
      const { a, b, yOffset } = orbitParamsRef.current;
      if (active) t = (t + dt * REV_RATE) % 1;
      const angle = t * Math.PI * 2;

      const x = a * Math.cos(angle);
      const z = b * Math.sin(angle);
      flyer.position.set(x, 0, z);

      // tilt by x position
      const tiltDeg = -15 * (x / (a || 1));
      orbitPlane.rotation.set(0, 0, THREE.MathUtils.degToRad(tiltDeg));

      // vertical oscillation
      const ampWorld = pxToWorldY(window.innerHeight * 0.15);
      orbitPlane.position.y = yOffset + Math.sin(angle) * ampWorld;

      // face along tangent
      const tx = -a * Math.sin(angle);
      const tz =  b * Math.cos(angle);
      flyer.rotation.y = Math.atan2(tz, tx);

      // gentle roll
      payload.rotation.z += dt * 0.3;

      // depth scale and z-index flip
      const depth01 = (z / (b || 1) + 1) / 2; // 0..1
      const scale = (0.8 + 0.7 * depth01) * OBJECT_SCALE_MULT;
      payload.scale.setScalar(scale);

      if (canvasRef.current) {
        canvasRef.current.style.zIndex = z >= 0 ? "9999" : "0";
      }

      // render
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  /* =========================================================
     Render (DOM)
     ========================================================= */
  return (
    <section
      ref={sectionRef}
      aria-label="Two-Window Posts"
      style={{
        ...sizingVars,
        position: "relative",
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
        background: "transparent",
      }}
      className="w-full min-h-screen"
    >
      {/* Gradient layer (always at the very back) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: GRADIENT_BG,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          zIndex: 0,
        }}
      />

      {/* Three.js Canvas (above gradient) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0"
        style={{
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0,
          transition: "opacity 180ms linear",
        }}
      />

      {/* Goose window (scrolls with section) */}
      <figure
        aria-hidden
        style={{
          position: "absolute",
          top: -14,
          left: 12,
          width: "min(44vmin, 560px)",
          height: "min(36vmin, 440px)",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <img
          src="/popular/goose.png"
          alt="Popular"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          loading="eager"
          decoding="async"
        />
      </figure>

      {/* Main windows (content on top) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
        <div className="flex flex-wrap items-center justify-center" style={{ gap: "min(8vw, 48px)" }}>
          {/* Window 1: Title + SNIPPET */}
          <figure
            style={{
              width: "calc(var(--s) * var(--scale))",
              height: "calc(var(--s) * var(--scale))",
              background: "#000",
              position: "relative",
              overflow: "hidden",
              border: `${FRAME_THICKNESS_PX}px solid ${FRAME_COLOR}`,
              boxShadow: `0 0 0 ${FRAME_THICKNESS_PX}px ${FRAME_COLOR}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
              textAlign: "center",
            } as CSSProperties}
          >
            <div style={{ ...LABEL_STYLE, fontSize: "clamp(13px, 1.333vw, 19px)", opacity: 0.95 }}>
              Latest from our posts
            </div>
            <div
              style={{ ...TITLE_STYLE, fontSize: "clamp(24px, 3.2vw, 40px)", marginTop: 10, marginBottom: 12 }}
              dangerouslySetInnerHTML={{ __html: escapeHtml(current?.title || "Loading…") }}
            />
            <blockquote
              style={{
                ...QUOTE_STYLE,
                fontSize: "clamp(18px, 1.6vw, 24px)",
                maxWidth: "92%",
                opacity: 0.95,
              }}
            >
              {current?.quote || "…"}
            </blockquote>
          </figure>

          {/* Window 2: Image + button with straight corners */}
          <figure
            style={{
              width: "calc(var(--s) * var(--scale) * 2)",
              height: "calc(var(--s) * var(--scale))",
              background: "#111",
              position: "relative",
              overflow: "hidden",
              border: `${FRAME_THICKNESS_PX}px solid ${FRAME_COLOR}`,
              boxShadow: `0 0 0 ${FRAME_THICKNESS_PX}px ${FRAME_COLOR}`,
            } as CSSProperties}
          >
            {current?.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.title}
                loading="eager"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
              />
            ) : (
              <div style={{ color: "white", fontSize: "clamp(13px, 1.333vw, 19px)" }}>No image</div>
            )}

            {/* Fixed CTA button bottom-right — straight corners */}
            <a
              href={current?.url || "#"}
              target="_self"
              rel="noopener"
              style={{
                position: "absolute",
                right: 14,
                bottom: 12,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  fontSize: "clamp(13px, 1.333vw, 19px)",
                  border: "2px solid rgba(255,255,255,0.85)",
                  padding: "10px 14px",
                  borderRadius: 0,
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(2px)",
                  display: "inline-block",
                }}
              >
                Read more
              </span>
            </a>
          </figure>
        </div>
      </div>

      <OrbitDebug
        a={orbitParams.a}
        b={orbitParams.b}
        y={orbitParams.yOffset}
        onChange={(a, b, y) => setOrbitParams({ a, b, yOffset: y })}
      />
    </section>
  );
}

/* =========================================================
   Plain helpers
   ========================================================= */
function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = html
    .replace(/\[\/.+?\]/g, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ");
  return decodeBasicEntities(tmp).replace(/\s+/g, " ").trim();
}
function decodeBasicEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
function truncateForQuote(s: string, max = 220): string {
  if (!s) return "";
  const clean = s.trim();
  if (clean.length <= max) return clean;
  const boundary = clean.lastIndexOf(". ", max - 1);
  const cut = boundary > 80 ? boundary + 1 : max;
  return clean.slice(0, cut).trim() + "…";
}
function escapeHtml(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function fallbackFromUrl(url: string): Slide {
  return {
    id: Math.random(),
    title: "Post Unavailable",
    quote: "Content could not be loaded.",
    imageUrl: "/placeholder.jpg",
    url,
  };
}

/* =========================================================
   Scroll lock helpers
   ========================================================= */
function lockScroll() {
  if (typeof document === "undefined") return;
  const root = document.documentElement; const body = document.body;
  const sbw = window.innerWidth - root.clientWidth;
  root.style.overflow = "hidden"; body.style.overflow = "hidden";
  if (sbw > 0) { root.style.paddingRight = `${sbw}px`; body.style.paddingRight = `${sbw}px`; }
}
function unlockScroll() {
  if (typeof document === "undefined") return;
  const root = document.documentElement; const body = document.body;
  root.style.overflow = ""; body.style.overflow = ""; root.style.paddingRight = ""; body.style.paddingRight = "";
}
